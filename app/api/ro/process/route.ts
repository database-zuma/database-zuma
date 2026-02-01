import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    let query = supabase
      .from('ro_process')
      .select('*')
      .order('created_at', { ascending: false });

    if (status && status !== 'ALL') {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) throw error;

    const roMap = new Map();
    (data || []).forEach((row: any) => {
      if (!roMap.has(row.ro_id)) {
        roMap.set(row.ro_id, {
          id: row.ro_id,
          store: row.store_name,
          createdAt: new Date(row.created_at).toLocaleDateString('en-GB'),
          currentStatus: row.status,
          dnpbNumber: row.dnpb_number || null,
          dnpbMatch: row.dnpb_match || null,
          totalBoxes: 0,
          totalArticles: 0,
          dddBoxes: 0,
          ljbbBoxes: 0,
          mbbBoxes: 0,
          ubbBoxes: 0,
          articles: [],
        });
      }
      const ro = roMap.get(row.ro_id);
      ro.totalArticles += 1;
      ro.totalBoxes += row.boxes_requested || 0;
      ro.dddBoxes += row.boxes_allocated_ddd || 0;
      ro.ljbbBoxes += row.boxes_allocated_ljbb || 0;
      ro.mbbBoxes += row.boxes_allocated_mbb || 0;
      ro.ubbBoxes += row.boxes_allocated_ubb || 0;
      ro.articles.push({
        kodeArtikel: row.article_code,
        namaArtikel: row.article_name || row.article_code,
        boxesRequested: row.boxes_requested || 0,
        dddBoxes: row.boxes_allocated_ddd || 0,
        ljbbBoxes: row.boxes_allocated_ljbb || 0,
        mbbBoxes: row.boxes_allocated_mbb || 0,
        ubbBoxes: row.boxes_allocated_ubb || 0,
      });
    });

    return NextResponse.json({
      success: true,
      data: Array.from(roMap.values()),
    });
  } catch (error: any) {
    console.error('Error fetching RO process:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
