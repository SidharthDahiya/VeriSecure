// src/lib.cairo
use starknet::ContractAddress;

#[starknet::interface]
trait IAuditRegistry<TContractState> {
    fn submit_audit_result(
        ref self: TContractState,
        contract_hash: felt252,
        score: u8,
        high_issues: u32,
        medium_issues: u32,
        low_issues: u32,
        ipfs_report_hash: felt252
    ) -> u256;

    fn get_audit_result(self: @TContractState, audit_id: u256) -> AuditResult;
    fn get_latest_audit_for_contract(self: @TContractState, contract_hash: felt252) -> AuditResult;
    fn get_audit_count(self: @TContractState) -> u256;
    fn is_contract_audited(self: @TContractState, contract_hash: felt252) -> bool;
}

#[derive(Drop, Serde, starknet::Store)]
struct AuditResult {
    audit_id: u256,
    contract_hash: felt252,
    auditor: ContractAddress,
    score: u8,
    high_issues: u32,
    medium_issues: u32,
    low_issues: u32,
    total_issues: u32,
    timestamp: u64,
    ipfs_report_hash: felt252,
    is_active: bool,
}

#[starknet::contract]
mod AuditRegistry {
    use super::{AuditResult};
    use starknet::{ContractAddress, get_caller_address, get_block_timestamp};
    use starknet::storage::{
        StoragePointerReadAccess, StoragePointerWriteAccess,
        StoragePathEntry, Map
    };

    #[storage]
    struct Storage {
        audit_count: u256,
        audits: Map<u256, AuditResult>,
        contract_latest_audit: Map<felt252, u256>,
        authorized_auditors: Map<ContractAddress, bool>,
        owner: ContractAddress,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        AuditSubmitted: AuditSubmitted,
    }

    #[derive(Drop, starknet::Event)]
    struct AuditSubmitted {
        audit_id: u256,
        contract_hash: felt252,
        auditor: ContractAddress,
        score: u8,
        total_issues: u32,
    }

    #[constructor]
    fn constructor(ref self: ContractState, owner: ContractAddress) {
        self.owner.write(owner);
        self.audit_count.write(0);
        // Initialize owner as authorized auditor
        self.authorized_auditors.entry(owner).write(true);
    }

    #[abi(embed_v0)]
    impl AuditRegistryImpl of super::IAuditRegistry<ContractState> {
        fn submit_audit_result(
            ref self: ContractState,
            contract_hash: felt252,
            score: u8,
            high_issues: u32,
            medium_issues: u32,
            low_issues: u32,
            ipfs_report_hash: felt252
        ) -> u256 {
            let caller = get_caller_address();

            // For now, allow any address to submit (you can add authorization later)
            // assert(self.authorized_auditors.entry(caller).read(), 'Unauthorized auditor');

            // Validate score (0-100)
            assert(score <= 100, 'Invalid score');

            let audit_id = self.audit_count.read() + 1;
            let total_issues = high_issues + medium_issues + low_issues;

            let audit_result = AuditResult {
                audit_id,
                contract_hash,
                auditor: caller,
                score,
                high_issues,
                medium_issues,
                low_issues,
                total_issues,
                timestamp: get_block_timestamp(),
                ipfs_report_hash,
                is_active: true,
            };

            // Store the audit result
            self.audits.entry(audit_id).write(audit_result);
            self.contract_latest_audit.entry(contract_hash).write(audit_id);
            self.audit_count.write(audit_id);

            // Emit event
            self.emit(Event::AuditSubmitted(AuditSubmitted {
                audit_id,
                contract_hash,
                auditor: caller,
                score,
                total_issues,
            }));

            audit_id
        }

        fn get_audit_result(self: @ContractState, audit_id: u256) -> AuditResult {
            self.audits.entry(audit_id).read()
        }

        fn get_latest_audit_for_contract(self: @ContractState, contract_hash: felt252) -> AuditResult {
            let latest_audit_id = self.contract_latest_audit.entry(contract_hash).read();
            assert(latest_audit_id > 0, 'No audit found');
            self.audits.entry(latest_audit_id).read()
        }

        fn get_audit_count(self: @ContractState) -> u256 {
            self.audit_count.read()
        }

        fn is_contract_audited(self: @ContractState, contract_hash: felt252) -> bool {
            let latest_audit_id = self.contract_latest_audit.entry(contract_hash).read();
            latest_audit_id > 0
        }
    }

    #[generate_trait]
    impl PrivateImpl of PrivateTrait {
        fn authorize_auditor(ref self: ContractState, auditor: ContractAddress) {
            let caller = get_caller_address();
            assert(caller == self.owner.read(), 'Only owner can authorize');
            self.authorized_auditors.entry(auditor).write(true);
        }
    }
}
