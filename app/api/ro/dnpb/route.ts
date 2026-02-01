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

    const { roId, dnpbNumber } = await request.json();

    if (!roId || !dnpbNumber) {
      return NextResponse.json(
        { success: false, error: 'Missing roId or dnpbNumber' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('ro_process')
      .update({ dnpb_number: dnpbNumber, updated_at: new Date().toISOString() })
      .eq('ro_id', roId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error updating DNPB:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
