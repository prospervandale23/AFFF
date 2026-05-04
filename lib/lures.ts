import { supabase } from './supabase';

export interface Lure {
  id: string;
  name: string;
  fishing_type: 'freshwater' | 'saltwater';
  price_range: string;
  photo_url: string | null;
  created_by: string | null;
  created_at: string;
}

export interface LureWithCount extends Lure {
  recommendation_count: number;
  user_has_recommended: boolean;
}

export async function getLuresForFishingType(
  fishingType: 'freshwater' | 'saltwater'
): Promise<Lure[]> {
  const { data, error } = await supabase
    .from('lures')
    .select('*')
    .eq('fishing_type', fishingType)
    .order('name');
  if (error) throw error;
  return data ?? [];
}

export async function getSpeciesLures(
  speciesId: string,
  userId: string
): Promise<LureWithCount[]> {
  const { data, error } = await supabase
    .from('lure_recommendations')
    .select('lure_id, user_id, lures(*)')
    .eq('species_id', speciesId);
  if (error) throw error;

  const map = new Map<string, { lure: Lure; count: number; mine: boolean }>();
  for (const row of data ?? []) {
    const lure = (row as any).lures as Lure;
    if (!lure) continue;
    const entry = map.get(lure.id);
    if (entry) {
      entry.count++;
      if (row.user_id === userId) entry.mine = true;
    } else {
      map.set(lure.id, { lure, count: 1, mine: row.user_id === userId });
    }
  }

  return [...map.values()]
    .map(({ lure, count, mine }) => ({
      ...lure,
      recommendation_count: count,
      user_has_recommended: mine,
    }))
    .sort((a, b) => b.recommendation_count - a.recommendation_count);
}

export async function recommendLure(
  lureId: string,
  speciesId: string,
  userId: string
): Promise<void> {
  const { error } = await supabase
    .from('lure_recommendations')
    .insert({ lure_id: lureId, species_id: speciesId, user_id: userId });
  if (error) throw error;
}

export async function createLureWithPhoto(
  name: string,
  fishingType: 'freshwater' | 'saltwater',
  priceRange: string,
  photoUri: string | null,
  createdBy: string
): Promise<Lure> {
  const { data, error } = await supabase
    .from('lures')
    .insert({
      name: name.trim(),
      fishing_type: fishingType,
      price_range: priceRange.trim(),
      created_by: createdBy,
    })
    .select()
    .single();
  if (error) throw error;

  if (photoUri) {
    const fileExt = photoUri.split('.').pop()?.toLowerCase() ?? 'jpg';
    const filePath = `${data.id}/photo.${fileExt}`;
    const response = await fetch(photoUri);
    const buffer = await response.arrayBuffer();
    const { error: uploadErr } = await supabase.storage
      .from('lure-photos')
      .upload(filePath, buffer, {
        contentType: `image/${fileExt === 'jpg' ? 'jpeg' : fileExt}`,
        upsert: true,
      });
    if (!uploadErr) {
      const { data: { publicUrl } } = supabase.storage
        .from('lure-photos')
        .getPublicUrl(filePath);
      await supabase.from('lures').update({ photo_url: publicUrl }).eq('id', data.id);
      return { ...data, photo_url: publicUrl };
    }
  }

  return data;
}
