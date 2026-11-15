// Pinned toolkit builder only: the general CLI also initializes unrelated device/emulator commands.
const Builder = require('aiot-toolkit/lib/builder/VelaUxBuilder').default;
const builder = new Builder();
builder.build(process.cwd(), {mode: 'development', enableJsc: true, watch: false})
  .catch(e => { console.error(e.message); process.exitCode = 1; })
  .finally(() => builder.dispose());
