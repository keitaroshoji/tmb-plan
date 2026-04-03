import { TmbWizardAnswers, OperationStyle, DeviceType } from '@/src/types/answers'

export interface ProductPlan {
  productKey: string
  productName: string
  reason: string
  monthlyUnitPrice: number // 円（12ヶ月契約）
  initialCostPerUnit: number
}

export interface DevicePlan {
  recommendedProducts: ProductPlan[]
  idealDeviceCount: number
  currentDeviceCount: number
  shortfallCount: number
  estimatedMonthlyCost: number
  estimatedInitialCost: number
  estimatedTotalCost12m: number
  contractMonths: number
  operationStyleLabel: string
}

// 製品マスター（device-planning-toolから流用・簡略版）
const PRODUCTS: Record<string, { name: string; monthlyPrice12m: number; initialCost: number }> = {
  mobile_wifi: { name: 'モバイル端末（Wi-Fi）', monthlyPrice12m: 4980, initialCost: 3800 },
  mobile_cellular: { name: 'モバイル端末（セルラー）', monthlyPrice12m: 5980, initialCost: 3800 },
  smart_monitor: { name: 'スマートモニター（32型）', monthlyPrice12m: 12000, initialCost: 3800 },
  camera_wearable: { name: 'ウェアラブルカメラ', monthlyPrice12m: 7500, initialCost: 0 },
  camera_wearable_mic: { name: 'ウェアラブルカメラ＋ワイヤレスマイク', monthlyPrice12m: 9500, initialCost: 0 },
}

const OPERATION_STYLE_LABELS: Record<OperationStyle, string> = {
  group_training: '集合研修タイプ（10人に1台）',
  group_shared: 'グループ共有タイプ（3人に1台）',
  workplace_unit: '職場単位タイプ（拠点ごと2〜3台）',
  individual: '個人割り振りタイプ（1人1台）',
  byod: 'BYODタイプ（個人端末活用）',
}

function calcIdealCount(style: OperationStyle, locationCount: number, staffPerLocation: number): number {
  const totalStaff = locationCount * staffPerLocation
  switch (style) {
    case 'group_training': return Math.max(locationCount, Math.ceil(totalStaff * 0.1))
    case 'group_shared': return Math.ceil(totalStaff * 0.3)
    case 'workplace_unit': return locationCount * 2
    case 'individual': return totalStaff
    case 'byod': return 0
  }
}

function calcCurrentTotal(answers: TmbWizardAnswers): number {
  const storeTotal = Object.values(answers.currentDevicesByType).reduce((s, v) => s + (v ?? 0), 0)
  const hqTotal = Object.values(answers.headquartersDevicesByType).reduce((s, v) => s + (v ?? 0), 0)
  return storeTotal * answers.locationCount + hqTotal
}

export function recommendDevicePlan(answers: TmbWizardAnswers): DevicePlan {
  const style = answers.operationStyle ?? 'group_shared'
  const ideal = calcIdealCount(style, answers.locationCount, answers.staffPerLocation)
  const current = calcCurrentTotal(answers)
  const shortfall = Math.max(0, ideal - current)

  const recommended: ProductPlan[] = []

  // メイン端末の選定
  const isCellular = answers.isFranchise || answers.locationCount >= 5
  if (answers.deviceTypes?.includes('smartphone') || answers.deviceTypes?.includes('tablet')) {
    const key = isCellular ? 'mobile_cellular' : 'mobile_wifi'
    const p = PRODUCTS[key]
    recommended.push({
      productKey: key,
      productName: p.name,
      reason: isCellular
        ? 'FC・多拠点展開に最適。SIM内蔵でWi-Fiなしでも安定動作'
        : 'コストを抑えてスタート。Wi-Fi環境があれば十分な性能',
      monthlyUnitPrice: p.monthlyPrice12m,
      initialCostPerUnit: p.initialCost,
    })
  }

  // 大型モニター
  if (answers.deviceTypes?.includes('large_monitor')) {
    const p = PRODUCTS['smart_monitor']
    recommended.push({
      productKey: 'smart_monitor',
      productName: p.name,
      reason: '常時マニュアル表示・顧客向け情報表示に最適な32型Androidモニター',
      monthlyUnitPrice: p.monthlyPrice12m,
      initialCostPerUnit: p.initialCost,
    })
  }

  // カメラ
  if (answers.useCases?.includes('video_shooting')) {
    const key = answers.shootingEnvironment === 'very_noisy' ? 'camera_wearable_mic' : 'camera_wearable'
    const p = PRODUCTS[key]
    recommended.push({
      productKey: key,
      productName: p.name,
      reason: '動画マニュアル作成に最適。一人称・三人称両対応のウェアラブルカメラ',
      monthlyUnitPrice: p.monthlyPrice12m,
      initialCostPerUnit: p.initialCost,
    })
  }

  // コスト計算（メイン端末 × 不足台数）
  const mainProduct = recommended[0]
  const contractMonths = 12
  const monthlyCost = mainProduct ? mainProduct.monthlyUnitPrice * shortfall : 0
  const initialCost = mainProduct ? mainProduct.initialCostPerUnit * shortfall : 0
  const total12m = monthlyCost * contractMonths + initialCost

  return {
    recommendedProducts: recommended,
    idealDeviceCount: ideal,
    currentDeviceCount: current,
    shortfallCount: shortfall,
    estimatedMonthlyCost: monthlyCost,
    estimatedInitialCost: initialCost,
    estimatedTotalCost12m: total12m,
    contractMonths,
    operationStyleLabel: OPERATION_STYLE_LABELS[style],
  }
}
