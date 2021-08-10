# FritzBox Call List

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
