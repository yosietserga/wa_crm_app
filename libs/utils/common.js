import CryptoJS, { AES } from "crypto-js";
import Cookies from "js-cookie";

const iv = CryptoJS.enc.Utf8.parse("1514838699281281");
const secret = "b7352d2424bb2072655a519547f5a9df";
const hashCookies = true;
export const COOKIE_PATH = hash("MagentaCapital_SPA_");

export function generateRandomString(length) {
  var result = "";
  var characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  var charactersLength = characters.length;
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

export function encrypt(s, parse = false) {
  s = parse ? JSON.stringify(s) : s;
  const h = AES.encrypt(s, secret, { iv });
  return h.toString();
}

export function decrypt(s, parse = false) {
  var h = AES.decrypt(s, secret, { iv });
  return parse
    ? JSON.stringify(h.toString(CryptoJS.enc.Utf8))
    : h.toString(CryptoJS.enc.Utf8);
}

export function hash(str) {
  return CryptoJS.MD5(str + ":" + secret);
}

export function removeCookie(k, __customCookieString = null) {
  try {
    let c;
    if (!!__customCookieString) {
      //lets use custm store as cookie
      c = getCookie(null, __customCookieString);
    } else {
      c = getCookie();
    }
    const __key = hashCookies ? hash(k) : k;
    c[__key] = null;
    delete c[__key];
    
    let ch = encrypt(JSON.stringify(c));
    Cookies.set(COOKIE_PATH, JSON.stringify(ch));
  } catch (error) {
    console.error({error});
  }
}

export function setCookie(k, v, __customCookieString = null) {
  try {
    let c;
    if (!!__customCookieString) {
      //lets use custm store as cookie
      c = getCookie(null, __customCookieString);
    } else {
      c = getCookie();
    }

    const __key = hashCookies ? hash(k) : k;
    
    c[__key] = v;
    let ch = encrypt(JSON.stringify(c));
    Cookies.set(COOKIE_PATH, JSON.stringify(ch));
  } catch (error) {
    console.error({ error });
  }
}

export function getCookie(k = null, __customCookieString = null) {
  try {
    let __cookie = Cookies.get(COOKIE_PATH);

    const __key = hashCookies ? hash(k) : k;
    
    if (!!__customCookieString) {
      //lets use custm store as cookie
      let c = JSON.parse(decrypt(JSON.parse(__customCookieString)));
      return !k ? c : !!c[__key] ? c[__key] : null;
    }

    if (!__cookie) initCookie();

    let c;
    c = Cookies.get(COOKIE_PATH);
    c = JSON.parse(c);
    c = decrypt(c);  
    c = JSON.parse(c);

    return !k ? c : !!c[__key] ? c[__key] : null;
  } catch (error) {
    console.error({error});
  }
}

export function initCookie() {
    Cookies.set(COOKIE_PATH, JSON.stringify(encrypt(JSON.stringify({a:1}))));
}

export function setToken(o) {
  if (!!o?.email) return false;

  let s = encrypt(o);
  setCookie("token", s);
}

export function getToken() {
  let s = getCookie("token");
  let t = decrypt(s);
  return t || false;
}

export function log(...args) {
  console.log(...args);
}

export function empty(mixedVar) {
  let undef;
  let key;
  let i;
  let len;
  const emptyValues = [undef, null, false, 0, "", "0"];
  for (i = 0, len = emptyValues.length; i < len; i++) {
    if (mixedVar === emptyValues[i]) {
      return true;
    }
  }
  if (typeof mixedVar === "object") {
    for (key in mixedVar) {
      if (mixedVar.hasOwnProperty(key)) {
        return false;
      }
    }
    return true;
  }
  return false;
}

export function isset() {
  const a = arguments;
  const l = a.length;
  let i = 0;
  let undef;
  if (l === 0) {
    throw new Error("Empty isset");
  }
  while (i !== l) {
    if (a[i] === undef || a[i] === null) {
      return false;
    }
    i++;
  }
  return true;
}
export function ucfirst(str) {
  str += "";
  const f = str.charAt(0).toUpperCase();
  return f + str.substr(1);
};

export function ucfsplit(str) {
  return ucfirst(
    ucfirst(str.split("_").join(" "))
      .match(/[A-Z]+(?![a-z])|[A-Z]?[a-z]+|\d+/g)
      .join(" ")
  );
}

export function unique(value, index, self) {
  return self.indexOf(value) === index;
};

export function isPrimitive(test) {
  return test !== Object(test);
}

//init cookie var just when is in browser
if (typeof window != 'undefined') setCookie("init", 1);