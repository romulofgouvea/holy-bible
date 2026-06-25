# Bíblia Online

Aplicativo de Bíblia para Android desenvolvido com **Expo / React Native**.

## Funcionalidades

- Leitura de 5 versões da Bíblia: ACF, ARA, NAA, NVI, NVT
- Busca de versículos por palavra-chave
- Destaques e histórico de leitura
- Planos de leitura (clássico, cronológico, NT e AT em diferentes durações)
- Áudio de capítulos por versão
- Estudos bíblicos com editor próprio e gerenciamento de versículos
- Comparação de versões em tela dupla com scroll sincronizado
- Temas do leitor (claro, sépia, escuro) com controle de fonte e alinhamento
- Backup e restauração do progresso do usuário
- Suporte a haptics, modo escuro e temas de cor

## Primeiros passos

```bash
npm install
expo start        # abre o Metro bundler; escaneie o QR no Expo Go
```

Para rodar direto no dispositivo/emulador Android:

```bash
expo run:android
```

## Tecnologias principais

- [Expo](https://expo.dev) / React Native
- [Expo Router](https://expo.github.io/router) — roteamento file-based
- [@shopify/flash-list](https://shopify.github.io/flash-list/) — lista de versículos
- [react-native-reanimated](https://docs.swmansion.com/react-native-reanimated/) — animações
- [AsyncStorage](https://react-native-async-storage.github.io/async-storage/) — persistência local
- expo-audio — reprodução de áudio
- expo-haptics — feedback tátil