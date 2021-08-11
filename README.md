# FritzBox Call List

[![codecov](https://codecov.io/gh/kaaax0815/fritzboxcalllist/branch/main/graph/badge.svg?token=LHVTQS0EJ2)](https://codecov.io/gh/kaaax0815/fritzboxcalllist)
[![Release CI](https://github.com/kaaax0815/fritzboxcalllist/actions/workflows/release.yml/badge.svg?branch=main)](https://github.com/kaaax0815/fritzboxcalllist/actions/workflows/release.yml)
[![npm](https://img.shields.io/npm/v/fritzboxcalllist)](https://www.npmjs.com/package/fritzboxcalllist)
![TypeScript](https://badgen.net/badge/TypeScript/strict%20💪/blue)

## 💻 First Start

### YARN

```bash
yarn add fritzboxcalllist
```

### NPM

```bash
npm install fritzboxcalllist
```

## 🚀 Usage

### Typescript

```ts
import FritzBox from 'fritzboxcalllist';

async function main() {
  const fritzbox = new FritzBox({ username: 'your-username', password: 'your-password' });

  const callListURL = await fritzbox.getCallListUrl();

  console.log(callListURL);
}

main();
```

## 📖 Documentation

Documentation can be found [here](https://kaaax0815.github.io/fritzboxcalllist/).

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
