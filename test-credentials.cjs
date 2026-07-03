const { GoogleAuth } = require('google-auth-library');

async function main() {
  try {
    const auth = new GoogleAuth();
    const credentials = await auth.getCredentials();
    const projectId = await auth.getProjectId();
    console.log('Project ID:', projectId);
    console.log('Client Email:', credentials.client_email || 'No email found (using local metadata/ADC)');
    const client = await auth.getClient();
    console.log('Identity details:', client.email || 'Compute Engine / Cloud Run Default Service Account');
  } catch (err) {
    console.error('Failed to get credentials:', err);
  }
}

main();
