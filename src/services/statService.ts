import { supabase } from '../lib/supabaseClient';
import { UserProfile } from '../types/userProfile';

interface LogClickParams {
  siteId: string;
  siteName?: string;
  equipmentId?: string;
  equipmentName?: string;
  userProfile: UserProfile | null;
}

/**
 * 프로필 설정을 완료한 사용자에 한해 지점 및 운동기구 클릭 로그를 Supabase에 저장합니다.
 */
export const logEquipmentClick = async ({
  siteId,
  siteName,
  equipmentId,
  equipmentName,
  userProfile
}: LogClickParams): Promise<void> => {
  // 조건 검사: 개인정보 설정을 완료한 사용자만 로그 수집
  if (!userProfile || !userProfile.isConfigured) {
    console.log('[statService] 개인정보 미설정 사용자로 통계 수집 대상이 아닙니다.');
    return;
  }

  try {
    const { error } = await supabase.from('site_click_logs').insert([
      {
        site_id: String(siteId),
        site_name: siteName || '',
        equipment_id: equipmentId ? String(equipmentId) : null,
        equipment_name: equipmentName || null,
        birth_year: userProfile.birthYear,
        gender: userProfile.gender,
        region: userProfile.region,
      },
    ]);

    if (error) {
      console.error('[statService] 통계 로그 저장 실패:', error.message);
    } else {
      console.log('[statService] 지점 및 운동기구 통계 로그 저장 성공:', {
        siteId,
        siteName,
        equipmentId,
        equipmentName,
        region: userProfile.region
      });
    }
  } catch (err) {
    console.error('[statService] 통계 로그 저장 예외 발생:', err);
  }
};