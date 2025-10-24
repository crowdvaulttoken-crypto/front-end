export const erc20Abi = [
    'function name() view returns (string)',
    'function symbol() view returns (string)',
    'function decimals() view returns (uint8)',
    'function totalSupply() view returns (uint256)',
    'function balanceOf(address) view returns (uint)',
    'function allowance(address owner, address spender) view returns (uint256)',
    'function approve(address spender, uint amount) returns (bool)',
    'function transfer(address to, uint amount) returns (bool)',
    'function transferFrom(address from, address to, uint amount) returns (bool)',
		'event Transfer(address indexed from, address indexed to, uint amount)'
  ];
  