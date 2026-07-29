sed -i 's/if (type === '\''guru'\'') {/if (type === '\''guru'\'' || type === '\''Guru'\'') {/g' server.ts
sed -i 's/else if (type === '\''tendik'\'') {/else if (type === '\''tendik'\'' || type === '\''Tendik'\'') {/g' server.ts
sed -i 's/else if (type === '\''murid'\'') {/else if (type === '\''murid'\'' || type === '\''Siswa'\'' || type === '\''Siswa'\'') {/g' server.ts
