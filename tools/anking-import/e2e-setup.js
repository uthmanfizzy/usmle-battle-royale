require('./config');
const {createClient}=require('@supabase/supabase-js');
const crypto=require('crypto');
const sb=createClient(process.env.SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
const TEST_USER_ID='00000000-dead-beef-0000-000000000001';
(async()=>{
  const {error}=await sb.from('users').upsert({
    id:TEST_USER_ID, username:'__anking_e2e_test__', email:'anking-e2e@test.invalid',
    xp:0, level:1, games_played:0, games_won:0, coins:0, gems:0,
  },{onConflict:'id'});
  if(error){console.error('user upsert failed:',error.message);process.exit(1);}
  console.log('test user ready:',TEST_USER_ID);

  // Grab a stable set of real cards to review, one of each type.
  const picks={};
  for(const t of ['cloze','mcq','basic']){
    const {data}=await sb.from('anking_cards').select('id,card_type,subject,anki_note_id').eq('card_type',t)
      .order('anki_note_id',{ascending:true}).order('id',{ascending:true}).limit(1);
    picks[t]=data[0];
  }
  console.log('sample cards:',JSON.stringify(picks,null,1));
  require('fs').writeFileSync('out/e2e-cards.json',JSON.stringify(picks,null,2));
})();
