const { createClient } = require('@supabase/supabase-js');

function isNewSupabaseApiKey(value) {
  return value.startsWith('sb_publishable_') || value.startsWith('sb_secret_');
}

function createSupabaseFetch(supabaseKey) {
  return (input, init) => {
    const headers = new Headers(
      typeof Request !== 'undefined' && input instanceof Request ? input.headers : undefined,
    );

    if (init && init.headers) {
      new Headers(init.headers).forEach((value, key) => headers.set(key, value));
    }

    if (isNewSupabaseApiKey(supabaseKey) && headers.get('Authorization') === `Bearer ${supabaseKey}`) {
      headers.delete('Authorization');
    }

    headers.set('apikey', supabaseKey);
    return fetch(input, { ...init, headers });
  };
}

const key = 'sb_publishable_iRgh04XcJ0rXMAsIobKUdQ_PVDmeBBA';
const supabase = createClient(
  'https://vmizwtxosmldxnjauoqc.supabase.co',
  key,
  {
    global: {
      fetch: createSupabaseFetch(key)
    }
  }
);

async function main() {
  let allData = [];
  let from = 0;
  const step = 1000;
  let hasMore = true;

  while (hasMore) {
    const { data, error } = await supabase
      .from('app_data')
      .select('*')
      .range(from, from + step - 1);

    if (error) {
      console.error(error);
      return;
    }

    if (data && data.length > 0) {
      allData = [...allData, ...data];
      if (data.length < step) hasMore = false;
      else from += step;
    } else {
      hasMore = false;
    }
  }

  let activities = [];

  // Parse individual activities
  allData.forEach(row => {
    if (row.key.startsWith('sweet_spot_activity_')) {
      activities.push(row.data);
    }
  });

  // Parse monolithic activities block if exists
  const monoRow = allData.find(r => r.key === 'sweet_spot_activities');
  if (monoRow && Array.isArray(monoRow.data)) {
    monoRow.data.filter(Boolean).forEach(act => {
      if (!activities.some(a => a.id === act.id)) {
        activities.push(act);
      }
    });
  }

  // Sort by timestamp asc
  activities.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  // Filter for the last 5 days
  const fiveDaysAgo = new Date();
  fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
  const recentActivities = activities.filter(a => new Date(a.timestamp) > fiveDaysAgo);

  console.log(`Total activities found: ${activities.length}`);
  console.log(`Recent activities (last 5 days): ${recentActivities.length}`);
  
  // Group recent updates by EJ
  const updatesByEj = {};
  recentActivities.forEach(act => {
    if (act.type === 'update') {
      if (!updatesByEj[act.ejName]) updatesByEj[act.ejName] = [];
      updatesByEj[act.ejName].push(act);
    }
  });

  for (const ejName in updatesByEj) {
    console.log(`\nEJ: ${ejName}`);
    updatesByEj[ejName].forEach(act => {
      console.log(`  - [${new Date(act.timestamp).toLocaleString()}] ${act.description}`);
    });
  }
}

main();
