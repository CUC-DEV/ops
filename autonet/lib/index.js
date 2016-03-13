const rsa = require("./rsa");
const hex2b64 = require("./base64");
const MODULE = "8099df2c3f092c05cccb6f24d5173860bf1772d7f7b8b60f5079a1b80700045d6f1b1c06d8b664515a4add8f3925e4fb053da7cd567b6be7c0d9f11218cf4e91";
const EMPOENT = "10001";

function encrypt(password) {
  var rsaKey = new rsa.RSAKey();
  rsaKey.setPublic(MODULE, EMPOENT);
  var encryptPwd = rsaKey.encrypt(password);
  if (encryptPwd) {
    encryptPwd = rsa.linebrk(hex2b64(encryptPwd), 64);
  } else {
    encryptPwd = null;
  }
  return encryptPwd;
 }

module.exports = encrypt;