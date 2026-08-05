# Bíblia Online

Aplicativo de Bíblia para Android com foco em leitura confortável, estudo pessoal e acompanhamento de planos. Desenvolvido com Expo / React Native.

## Funcionalidades

**Leitura**
- 5 versões da Bíblia: ACF, ARA, NAA, NVI, NVT
- Comparação lado a lado de duas versões com scroll sincronizado
- Temas do leitor: claro, sépia e escuro
- Controle de tamanho de fonte, alinhamento e família tipográfica
- Reprodução de áudio por capítulo
- Destaques de versículos em 7 cores
- Histórico de leitura recente

**Estudos**
- Editor de estudos bíblicos com rich text
- Inserção de versículos diretamente no estudo
- Exportação em PDF ou JSON
- Lixeira com recuperação em até 30 dias

**Planos de leitura**
- Planos clássico, cronológico, NT e AT
- Durações de 1 mês, 3 meses, 6 meses e 1 ano
- Acompanhamento de progresso com estatísticas (dias em atraso, previsão de conclusão)

**Busca**
- Pesquisa por palavra-chave em toda a Bíblia
- Filtros por versão, livro e capítulo
- Histório de buscas recentes

**Personalização & backup**
- Modo escuro e 6 temas de cores
- Feedback tátil (haptics)
- Backup e restauração completos do progresso do usuário

## Primeiros passos

```bash
npm install
expo start        # abre o Metro bundler; escaneie o QR no Expo Go
```

Para rodar direto no dispositivo/emulador Android:

```bash
expo run:android
```

## Tecnologias

| Biblioteca | Uso |
|---|---|
| [Expo](https://expo.dev) / React Native | base do app |
| [Expo Router](https://expo.github.io/router) | roteamento file-based |
| [@shopify/flash-list](https://shopify.github.io/flash-list/) | lista de versículos de alta performance |
| [react-native-reanimated](https://docs.swmansion.com/react-native-reanimated/) | animações |
| [AsyncStorage](https://react-native-async-storage.github.io/async-storage/) | persistência local (sem banco remoto) |
| expo-audio | reprodução de áudio |
| expo-haptics | feedback tátil |
| expo-file-system / expo-sharing | backup e exportação de arquivos |
| react-native-gesture-handler | gestos e interações |
