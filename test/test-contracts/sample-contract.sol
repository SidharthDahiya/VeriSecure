// SPDX-License-Identifier: MIT
pragma solidity ^0.7.6;

contract VulnerableBank {
    mapping(address => uint) public balances;

    function deposit() public payable {
        balances[msg.sender] += msg.value;
    }

    function withdraw(uint _amount) public {
        require(balances[msg.sender] >= _amount, "Insufficient funds");

        // Vulnerable to reentrancy
        (bool sent, ) = msg.sender.call{value: _amount}("");
        require(sent, "Failed to send Ether");

        // State change after external call
        balances[msg.sender] -= _amount;
    }

    // Unchecked arithmetic operations (overflow/underflow)
    function transfer(address _to, uint _amount) public {
        require(balances[msg.sender] >= _amount, "Insufficient funds");
        balances[msg.sender] -= _amount;
        balances[_to] += _amount;
    }

    // Missing access control
    function drainContract() public {
        uint balance = address(this).balance;
        (bool sent, ) = msg.sender.call{value: balance}("");
        require(sent, "Failed to send Ether");
    }

    // Unchecked external call
    function unsafeCall(address _target, bytes memory _data) public {
        _target.call(_data);
    }
}
