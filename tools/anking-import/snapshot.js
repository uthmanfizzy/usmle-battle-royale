require('./config');
const {createClient}=require('@supabase/supabase-js');
const sb=createClient(process.env.SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
(async()=>{
  const out={when:new Date().toISOString()};
  for(const t of ['anking_notes','anking_cards','anking_media']){
    const {count}=await sb.from(t).select('*',{count:'exact',head:true});
    out[t]=count;
  }
  for(const ct of ['cloze','mcq','basic']){
    const {count}=await sb.from('anking_cards').select('*',{count:'exact',head:true}).eq('card_type',ct);
    out['cards_'+ct]=count;
  }
  // newest created_at on cards/media proves nothing was rewritten
  for(const t of ['anking_cards','anking_media']){
    const {data}=await sb.from(t).select('created_at').order('created_at',{ascending:false}).limit(1);
    out[t+'_max_created_at']=data[0].created_at;
  }
  const {data:tt}=await sb.from('anking_notes').select('tags').eq('anki_note_id',1462050477056).limit(1);
  out.tags_typeof=typeof tt[0].tags;
  out.tags_is_array=Array.isArray(tt[0].tags);
  console.log(JSON.stringify(out,null,2));
  require('fs').writeFileSync(process.argv[2]||'out/snapshot-before.json',JSON.stringify(out,null,2));
})();
