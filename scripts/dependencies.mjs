import {createRequire} from 'node:module';
const local=createRequire(import.meta.url);
export function dependency(name){try{return local(name);}catch(error){if(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES)return local(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/'+name);throw error;}}
