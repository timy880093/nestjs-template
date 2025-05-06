export enum TicketTypeEnum {
  ELECTRONIC = 'electronic',
  PAPER = 'paper',
  APP_WEBSITE = 'app_website',
}

export enum VehicleTypeEnum {
  MOTORCYCLE = 'motorcycle', // 普通重型機車
  HEAVY_MOTORCYCLE = 'heavy_motorcycle', // 大型重型機車
  SMALL_PASSENGER_CARGO = 'small_passenger_cargo', // 小客貨
  SMALL_COMMERCIAL_TAXI = 'small_commercial_taxi', // 計程車
  LARGE_VEHICLE = 'large_vehicle', // 大型車
  TEMPORARY_PLATE = 'temporary_plate', //臨時牌
  TEST_PLATE = 'test_plate', //試車牌
}

export enum ViolationFactTypeEnum {
  SPEEDING = 'speeding', // 超速
  ILLEGAL_PARKING = 'illegal_parking', // 違停
  RED_LIGHT_VIOLATION = 'red_light_violation', // 闖紅燈
  WRONG_WAY_DRIVING = 'wrong_way_driving', // 逆向
  UNSAFE_FOLLOWING_DISTANCE = 'unsafe_following_distance', // 未保持安全車距
  FAILURE_TO_YIELD_TO_PEDESTRIANS = 'failure_to_yield_to_pedestrians', // 未禮讓行人
  SHOULDER_RELATED_VIOLATION = 'shoulder_related_violation', // 路肩相關
  U_TURN_VIOLATION = 'u_turn_violation', // 迴轉相關違規
  CROSSING_DOUBLE_SOLID_LINES = 'crossing_double_solid_lines', // 跨越雙白實線
  USING_HANDHELD_DEVICE = 'using_handheld_device', // 手持 3C
  MOTORCYCLE_ON_SIDEWALK = 'motorcycle_on_sidewalk', // 機車行駛人行道
  FAILURE_TO_STOP_AT_INTERSECTION = 'failure_to_stop_at_intersection', // 路口未停車再開
  CUTTING_INTO_TRAFFIC = 'cutting_into_traffic', // 插入連貫使出主線汽車間
  JAYWALKING = 'jaywalking', // 行人穿越馬路
  DRUNK_DRIVING = 'drunk_driving', // 酒駕
  UNCOVERED_CARGO_ON_HIGHWAY = 'uncovered_cargo_on_highway', // 高速公路貨物未覆蓋綑綁
  IMPROPER_MOTORCYCLE_LEFT_TURN = 'improper_motorcycle_left_turn', // 機車未依規定兩段式左轉
  WEAVING = 'weaving', // 蛇行
  OTHER = 'other', // 其他
}

export enum CityEnum {
  TAIPEI = 'taipei',
  NEW_TAIPEI = 'new_taipei',
  TAOYUAN = 'taoyuan',
  TAICHUNG = 'taichung',
  TAINAN = 'tainan',
  KAOHSIUNG = 'kaohsiung',
  OTHER = 'other',
}

export enum AppealResultEnum {
  APPROVED = 'approved',
  REJECTED = 'rejected',
  REDUCED = 'reduced',
}

export enum BotSubmittedStatusEnum {
  PROCESSING = 'processing',
  SUCCESSFUL = 'successful',
  FAILED = 'failed',
}
