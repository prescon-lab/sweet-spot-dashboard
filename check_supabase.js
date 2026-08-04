import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://vmizwtxosmldxnjauoqc.supabase.co',
  'sb_publishable_iRgh04XcJ0rXMAsIobKUdQ_PVDmeBBA'
);

async function main() {
  const { data, error } = await supabase.from('app_data').select('*');
  if (error) console.error(error);
  
  if (data) {
    const ejDataRow = data.find(r => r.key === 'sweet_spot_ej_data');
    if (ejDataRow) {
      console.log('--- EJ DATA ---');
      console.log(JSON.stringify(ejDataRow.data, null, 2).slice(0, 500) + '...');
    }
    
    const activitiesRow = data.find(r => r.key === 'sweet_spot_activities');
    if (activitiesRow) {
      console.log('--- ACTIVITIES ---');
      console.log(JSON.stringify(activitiesRow.data, null, 2));
    }
  }
}
main();
