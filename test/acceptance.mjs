// Run each acceptance flow in a new, private browser profile. No personal save data is used.
import {spawnSync} from 'node:child_process';
for (const flow of ['story','freeplay','championship','resume','decks']) {
 console.log(`Acceptance: ${flow}`);
 const result=spawnSync(process.execPath,[`test/acceptance-${flow}.mjs`],{stdio:'inherit',env:{...process.env,QA_OUT:process.env.QA_OUT?`${process.env.QA_OUT}/${flow}`:''},timeout:600000});
 if(result.error)throw result.error;
 if(result.status!==0)process.exit(result.status||1);
}
