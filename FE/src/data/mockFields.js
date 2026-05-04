export const vietnamFields = [
  {
    id: 'hn-01',
    name: 'Sân cỏ nhân tạo Hoàng Mai Arena',
    city: 'Hà Nội',
    district: 'Hoàng Mai',
    type: 'Sân 7',
    rating: 4.8,
    reviews: 128,
    pricePerHour: 650000,
    availableSlots: ['17:00 - 18:30', '19:00 - 20:30', '21:00 - 22:30'],
    amenities: ['Đèn chiếu sáng', 'Bãi xe máy', 'Phòng thay đồ', 'Nước uống'],
    image:
      'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1400&q=80',
    description:
      'Mặt sân cỏ mới, hệ thống chiếu sáng tốt, phù hợp đá giao hữu buổi tối và giải phong trào.',
  },
  {
    id: 'hcm-02',
    name: 'Sân Mini Thủ Đức Prime',
    city: 'TP. Hồ Chí Minh',
    district: 'Thủ Đức',
    type: 'Sân 5',
    rating: 4.6,
    reviews: 94,
    pricePerHour: 520000,
    availableSlots: ['16:30 - 18:00', '18:30 - 20:00', '20:30 - 22:00'],
    amenities: ['Camera an ninh', 'Căng tin', 'Wifi', 'Nhà vệ sinh'],
    image:
      'https://images.unsplash.com/photo-1556056504-5c7696c4c28d?auto=format&fit=crop&w=1400&q=80',
    description:
      'Sân thoáng, tiện di chuyển từ Xa lộ Hà Nội, phù hợp cho nhóm bạn và câu lạc bộ sinh viên.',
  },
  {
    id: 'dn-03',
    name: 'Sân Bóng Biển Mỹ Khê Center',
    city: 'Đà Nẵng',
    district: 'Sơn Trà',
    type: 'Sân 7',
    rating: 4.7,
    reviews: 77,
    pricePerHour: 580000,
    availableSlots: ['06:00 - 07:30', '17:30 - 19:00', '19:30 - 21:00'],
    amenities: ['Khu nghỉ đội', 'Máy lạnh mini', 'Loa bluetooth', 'Bãi ô tô'],
    image:
      'https://images.unsplash.com/photo-1486286701208-1d58e9338013?auto=format&fit=crop&w=1400&q=80',
    description:
      'Vị trí gần biển, không gian mát, phù hợp tổ chức giao lưu bóng đá cuối tuần.',
  },
  {
    id: 'ct-04',
    name: 'Sân Cần Thơ Riverside',
    city: 'Cần Thơ',
    district: 'Ninh Kiều',
    type: 'Sân 11',
    rating: 4.5,
    reviews: 59,
    pricePerHour: 980000,
    availableSlots: ['15:00 - 16:30', '17:00 - 18:30', '19:00 - 20:30'],
    amenities: ['Phòng họp đội', 'Quầy nước', 'Chỗ ngồi khán giả', 'Khu y tế'],
    image:
      'https://images.unsplash.com/photo-1459865264687-595d652de67e?auto=format&fit=crop&w=1400&q=80',
    description:
      'Sân kích thước lớn, phù hợp giải đấu doanh nghiệp và các trận giao hữu đông người.',
  },
];

export const userBookings = [
  {
    id: 'BK-2026-001',
    fieldName: 'Sân cỏ nhân tạo Hoàng Mai Arena',
    city: 'Hà Nội',
    date: '2026-04-21',
    slot: '19:00 - 20:30',
    amount: 650000,
    status: 'CONFIRMED',
  },
  {
    id: 'BK-2026-002',
    fieldName: 'Sân Mini Thủ Đức Prime',
    city: 'TP. Hồ Chí Minh',
    date: '2026-04-23',
    slot: '18:30 - 20:00',
    amount: 520000,
    status: 'PENDING',
  },
  {
    id: 'BK-2026-003',
    fieldName: 'Sân Bóng Biển Mỹ Khê Center',
    city: 'Đà Nẵng',
    date: '2026-04-15',
    slot: '17:30 - 19:00',
    amount: 580000,
    status: 'CANCELLED',
  },
];
