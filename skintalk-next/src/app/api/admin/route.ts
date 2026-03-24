import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL!.toLowerCase();

const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
});

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { action, data, userEmail } = body;

        if (!userEmail || userEmail.toLowerCase() !== adminEmail) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        switch (action) {
            case 'add_product': {
                const { name, price, image, category } = data;
                const { data: product, error } = await adminClient.from('products').insert({
                    name,
                    price,
                    image,
                    category
                }).select().single();
                
                if (error) return NextResponse.json({ error: error.message }, { status: 500 });
                return NextResponse.json({ success: true, data: product });
            }

            case 'delete_product': {
                const { id } = data;
                const { error } = await adminClient.from('products').delete().eq('id', id);
                
                if (error) return NextResponse.json({ error: error.message }, { status: 500 });
                return NextResponse.json({ success: true });
            }

            case 'update_product': {
                const { id, name, price, image, category, oldImage } = data;
                
                if (oldImage && oldImage !== image && oldImage.includes('supabase')) {
                    const fileName = oldImage.split('/').pop();
                    if (fileName) {
                        await adminClient.storage.from('products').remove([fileName]);
                    }
                }
                
                const { data: product, error } = await adminClient.from('products').update({
                    name,
                    price,
                    image,
                    category
                }).eq('id', id).select().single();
                
                if (error) return NextResponse.json({ error: error.message }, { status: 500 });
                return NextResponse.json({ success: true, data: product });
            }

            case 'add_category': {
                const { name } = data;
                const { data: category, error } = await adminClient.from('categories').insert({ name }).select().single();
                
                if (error) return NextResponse.json({ error: error.message }, { status: 500 });
                return NextResponse.json({ success: true, data: category });
            }

            case 'get_orders': {
                const { data: orders, error } = await adminClient.from('orders').select('*').order('created_at', { ascending: false });
                
                if (error) return NextResponse.json({ error: error.message }, { status: 500 });
                return NextResponse.json({ success: true, data: orders });
            }

            case 'update_order_status': {
                const { id, status } = data;
                const { error } = await adminClient.from('orders').update({ status }).eq('id', id);
                
                if (error) return NextResponse.json({ error: error.message }, { status: 500 });
                return NextResponse.json({ success: true });
            }

            case 'upload_image': {
                const { imageData, fileName } = data;
                const { data: uploadData, error } = await adminClient.storage
                    .from('products')
                    .upload(fileName, Buffer.from(imageData, 'base64'), {
                        contentType: 'image/*'
                    });

                if (error) return NextResponse.json({ error: error.message }, { status: 500 });

                const { data: { publicUrl } } = adminClient.storage
                    .from('products')
                    .getPublicUrl(fileName);

                return NextResponse.json({ success: true, url: publicUrl });
            }

            default:
                return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }
    } catch (error) {
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
