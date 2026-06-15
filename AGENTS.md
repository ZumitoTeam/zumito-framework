# AGENTS Instructions

## Testing

Para ejecutar los tests:

```
npm test
```

Para validar que la libreria compila correctamente ejecuta:

```
npm run build
```

No deberian aparecer errores. Si hay errores, corrige el código antes de enviar PR.

### Escribir tests para un bot

Los usuarios del framework pueden escribir tests importando las utilidades de `zumito-framework/testing`:

```ts
import { createTestFramework, createMockMessage } from 'zumito-framework/testing';

const { framework, client } = createTestFramework();
const message = createMockMessage({ content: '!ping' });
```

El framework incluye mocks para todos los objetos de discord.js: Client, Guild, GuildMember, TextChannel, Message, CommandInteraction, ButtonInteraction, StringSelectMenuInteraction, y ModalSubmitInteraction.
