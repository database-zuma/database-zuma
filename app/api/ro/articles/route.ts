import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { roId, articleCode, dddBoxes, ljbbBoxes, mbbBoxes, ubbBoxes } = await request.json();

    if (!roId || !articleCode) {
      return NextResponse.json(
        { success: false, error: 'Missing roId or articleCode' },
        { status: 400 }
      );
    }

    const updateData: any = { updated_at: new Date().toISOString() };
    if (dddBoxes !== undefined) updateData.boxes_allocated_ddd = dddBoxes;
    if (ljbbBoxes !== undefined) updateData.boxes_allocated_ljbb = ljbbBoxes;
    if (mbbBoxes !== undefined) updateData.boxes_allocated_mbb = mbbBoxes;
    if (ubbBoxes !== undefined) updateData.boxes_allocated_ubb = ubbBoxes;

    const { error } = await supabase
      .from('ro_process')
      .update(updateData)
      .eq('ro_id', roId)
      .eq('article_code', articleCode);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error updating article:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
