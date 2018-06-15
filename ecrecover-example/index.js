const contract = require('truffle-contract')
const Web3 = require('web3')
const provider = new Web3.providers.HttpProvider('http://localhost:8545')
const web3 = new Web3(provider)

const VerifierArtifact = require('./build/contracts/Verifier.json')
const Verifier = contract(VerifierArtifact)
Verifier.setProvider(provider)
// https://github.com/trufflesuite/truffle-contract/issues/56
Verifier.currentProvider.sendAsync = function () {
  return Verifier.currentProvider.send.apply(Verifier.currentProvider, arguments);
}

function toHex(str) {
	var hex = '';
	for(var i=0;i<str.length;i++) {
		hex += ''+str.charCodeAt(i).toString(16);
	}
	return hex;
}

const privateKey = '0x5297d9f977db1863535d327e964c0f4e2db48f0904fa3ac26f6bfb5c517880b9'
const account = web3.eth.accounts.privateKeyToAccount(privateKey)
const addr = account.address.toLowerCase()
const msg = 'school bus'
const hex_msg = '0x' + toHex(msg)
let sigObj = web3.eth.accounts.sign(msg, privateKey)
let signature = sigObj.signature

console.log(`address -----> ${addr}`)
console.log(`msg ---------> ${msg}`)
console.log(`hex(msg) ----> ${hex_msg}`)
console.log(`sig ---------> ${signature}`)

signature = signature.substr(2);
const r = '0x' + signature.slice(0, 64)
const s = '0x' + signature.slice(64, 128)
const v = '0x' + signature.slice(128, 130)
var v_decimal = web3.utils.toDecimal(v)
if(!(v_decimal == 27 || v_decimal == 28)) {
	v_decimal += 27
}

console.log(`r -----------> ${r}`)
console.log(`s -----------> ${s}`)
console.log(`v -----------> ${v}`)
console.log(`vd ----------> ${v_decimal}`)

Verifier
  .deployed()
  .then(instance => {
    // https://web3js.readthedocs.io/en/1.0/web3-eth-accounts.html#eth-accounts-sign
    const fixed_msg = `\x19Ethereum Signed Message:\n${msg.length}${msg}`
    const fixed_msg_sha = web3.utils.sha3(fixed_msg)
    return instance.recoverAddr.call(
      fixed_msg_sha,
      v_decimal,
      r,
      s
    )
  })
  .then(data => {
    console.log('-----data------')
    console.log(`created addr   => ${addr}`)
    console.log(`recovered addr => ${data}`)
  })
  .catch(e => {
    console.log('i got an error')
    console.log(e)
  })
