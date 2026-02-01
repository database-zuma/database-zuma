import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { data, error } = await supabase
      .from('ro_process')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const roMap = new Map<string, {
      id: string;
      store: string;
      totalBoxes: number;
      status: string;
      createdAt: string;
    }>();

    let totalBoxes = 0;
    let queuedCount = 0;

    (data || []).forEach((row: any) => {
      const boxes = row.boxes_requested || 0;
      totalBoxes += boxes;

      if (!roMap.has(row.ro_id)) {
        roMap.set(row.ro_id, {
          id: row.ro_id,
          store: row.store_name || 'Unknown',
          totalBoxes: 0,
          status: row.status || 'QUEUE',
          createdAt: row.created_at,
        });

        if (row.status === 'QUEUE') {
          queuedCount++;
        }
      }

      const ro = roMap.get(row.ro_id)!;
      ro.totalBoxes += boxes;
    });

    const roList = Array.from(roMap.values());
    const totalRO = roList.length;
    const totalPairs = totalBoxes * 12; // 1 box = 12 pairs (business rule)

    return NextResponse.json({
      success: true,
      data: {
        stats: {
          totalRO,
          queued: queuedCount,
          totalBoxes,
          totalPairs,
        },
        roList: roList.map(ro => ({
          id: ro.id,
          store: ro.store,
          box: ro.totalBoxes,
          status: ro.status.toLowerCase(),
        })),
      },
    });
  } catch (error: any) {
    console.error('Error fetching dashboard data:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
