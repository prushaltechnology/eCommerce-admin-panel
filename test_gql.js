async function run() {
  const query = `
    query {
      __schema {
        queryType {
          fields {
            name
            args {
              name
              type {
                name
                kind
              }
            }
          }
        }
      }
    }
  `;

  try {
    const response = await fetch('https://192.168.1.55:8000/graphql/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query })
    });

    const body = await response.json();
    const fields = body.data.__schema.queryType.fields;
    
    console.log(fields.map(f => f.name + '(' + f.args.map(a => a.name).join(', ') + ')').join('\n'));
  } catch (err) {
    console.error(err);
  }
}

run();
