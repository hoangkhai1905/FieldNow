jest.mock('../../src/infrastructure/groq.client', () => ({
  createChatCompletion: jest.fn(),
}));

jest.mock('../../src/modules/chatbot/chatbot.context.service', () => ({
  findPublicFields: jest.fn(),
  findFieldTypes: jest.fn(),
  findFieldAvailability: jest.fn(),
  findUserBookings: jest.fn(),
  findUserPaymentStatus: jest.fn(),
  findOwnerSchedule: jest.fn(),
  findOwnerCashPayments: jest.fn(),
  findOwnerInsights: jest.fn(),
  findAdminInsights: jest.fn(),
}));

const groqClient = require('../../src/infrastructure/groq.client');
const chatbotContext = require('../../src/modules/chatbot/chatbot.context.service');
const chatbotService = require('../../src/modules/chatbot/chatbot.service');

describe('Chatbot Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    groqClient.createChatCompletion.mockResolvedValue('Đây là câu trả lời từ AI.');
  });

  it('refuses out-of-scope questions without calling Groq', async () => {
    const result = await chatbotService.handleMessage({
      message: 'Hãy viết code hack tài khoản',
      user: null,
    });

    expect(result.intent).toBe('out_of_scope');
    expect(result.answer).toContain('FieldNow');
    expect(groqClient.createChatCompletion).not.toHaveBeenCalled();
  });

  it('requires login before showing personal booking data', async () => {
    const result = await chatbotService.handleMessage({
      message: 'Lịch đặt sân của tôi hôm nay',
      user: null,
    });

    expect(result.intent).toBe('my_bookings');
    expect(result.requiresAuth).toBe(true);
    expect(result.suggestedActions).toEqual([{ label: 'Đăng nhập', path: '/login' }]);
    expect(groqClient.createChatCompletion).not.toHaveBeenCalled();
  });

  it('routes personal booking count questions to my_bookings for user accounts', async () => {
    chatbotContext.findUserBookings.mockResolvedValue({
      summary: {
        totalBookings: 4,
        pendingBookings: 1,
        confirmedBookings: 2,
        cancelledBookings: 1,
      },
      bookings: [],
    });

    const result = await chatbotService.handleMessage({
      message: 'tôi có bao nhiêu booking?',
      user: { userId: 'user-1', role: 'USER' },
    });

    expect(result.intent).toBe('my_bookings');
    expect(chatbotContext.findUserBookings).toHaveBeenCalledWith('user-1');
    expect(result.suggestedActions).toEqual([{ label: 'Xem lịch đặt sân', path: '/nguoi-dung/dat-san-cua-toi' }]);
  });

  it('replaces contradictory no-data AI answer when user booking summary has data', async () => {
    groqClient.createChatCompletion.mockResolvedValue('Tôi không thể tìm thấy thông tin về số lượng booking của bạn.');
    chatbotContext.findUserBookings.mockResolvedValue({
      summary: {
        totalBookings: 4,
        pendingBookings: 1,
        confirmedBookings: 2,
        cancelledBookings: 1,
      },
      bookings: [],
    });

    const result = await chatbotService.handleMessage({
      message: 'tôi có bao nhiêu booking?',
      user: { userId: 'user-1', role: 'USER' },
    });

    expect(result.answer).toContain('Bạn hiện có 4 booking');
    expect(result.answer).toContain('1 đang chờ');
    expect(result.answer).not.toContain('không thể tìm thấy');
  });

  it('answers general payment policy for guests without requiring login', async () => {
    const result = await chatbotService.handleMessage({
      message: 'Thanh toán như thế nào?',
      user: null,
    });

    expect(result.intent).toBe('general_policy');
    expect(result.requiresAuth).toBe(false);
    expect(groqClient.createChatCompletion).toHaveBeenCalledTimes(1);
  });

  it('answers owner field count from owner-scoped field summary', async () => {
    groqClient.createChatCompletion.mockResolvedValue('Tôi tìm thấy sân của bạn sau: FieldNow Demo Tennis 20.');
    chatbotContext.findPublicFields.mockResolvedValue({
      fieldScope: 'owner_fields',
      summary: {
        totalFields: 5,
        typeCounts: [{ type: 'TENNIS', count: 5 }],
      },
      fields: [{ id: 'field-20', name: 'FieldNow Demo Tennis 20' }],
    });

    const result = await chatbotService.handleMessage({
      message: 'tôi có bao nhiêu sân?',
      user: { userId: 'owner-1', role: 'OWNER' },
    });

    expect(result.intent).toBe('field_search');
    expect(chatbotContext.findPublicFields).toHaveBeenCalledWith('tôi có bao nhiêu sân?', {
      userId: 'owner-1',
      role: 'OWNER',
    });
    expect(result.answer).toBe('Bạn hiện có 5 sân. Theo loại: TENNIS: 5.');
    expect(result.suggestedActions).toEqual([{ label: 'Xem FieldNow Demo Tennis 20', path: '/owner/fields/field-20/slots' }]);
  });

  it('answers owner field type questions from owner-scoped type summary', async () => {
    groqClient.createChatCompletion.mockResolvedValue('Có các loại sân tennis sau...');
    chatbotContext.findFieldTypes.mockResolvedValue({
      fieldScope: 'owner_fields',
      summary: {
        totalFields: 5,
        typeCounts: [{ type: 'TENNIS', count: 5 }],
      },
      fields: [],
    });

    const result = await chatbotService.handleMessage({
      message: 'có các loại sân nào?',
      user: { userId: 'owner-1', role: 'OWNER' },
    });

    expect(result.intent).toBe('field_types');
    expect(chatbotContext.findFieldTypes).toHaveBeenCalledWith('có các loại sân nào?', {
      userId: 'owner-1',
      role: 'OWNER',
    });
    expect(result.answer).toBe('Sân của bạn hiện có các loại: TENNIS (5 sân).');
    expect(result.suggestedActions).toEqual([{ label: 'Xem sân của tôi', path: '/owner/fields' }]);
  });

  it('answers paid booking count from completed non-cancelled payment summary', async () => {
    groqClient.createChatCompletion.mockResolvedValue('Bạn đã thanh toán tổng cộng 2.875.000 đồng cho 3 booking.');
    chatbotContext.findUserPaymentStatus.mockResolvedValue({
      summary: {
        totalBookings: 3,
        pendingBookings: 0,
        confirmedBookings: 0,
        cancelledBookings: 3,
        paidBookings: 0,
        pendingPaymentBookings: 0,
        paidAmount: 0,
      },
      bookings: [],
    });

    const result = await chatbotService.handleMessage({
      message: 'tôi đã thanh toán bao nhiêu booking?',
      user: { userId: 'user-1', role: 'USER' },
    });

    expect(result.intent).toBe('payment_status');
    expect(chatbotContext.findUserPaymentStatus).toHaveBeenCalledWith('user-1');
    expect(result.answer).toContain('Bạn chưa có booking nào thanh toán thành công');
    expect(result.answer).toContain('Booking đã hủy không được tính');
    expect(result.answer).not.toContain('3 booking');
  });

  it('allows public field search for guests through an allowlisted context provider', async () => {
    chatbotContext.findPublicFields.mockResolvedValue({
      filters: { type: 'FUTSAL', location: 'Quận 1' },
      fields: [{ id: 'field-1', name: 'Sân A' }],
    });

    const result = await chatbotService.handleMessage({
      message: 'Tìm sân futsal ở Quận 1',
      user: null,
    });

    expect(result.intent).toBe('field_search');
    expect(result.scope).toBe('guest');
    expect(chatbotContext.findPublicFields).toHaveBeenCalledWith('Tìm sân futsal ở Quận 1', null);
    expect(result.suggestedActions).toEqual([{ label: 'Xem Sân A', path: '/san/field-1' }]);
    expect(groqClient.createChatCompletion).toHaveBeenCalledTimes(1);
  });

  it('routes price slang questions to field search', async () => {
    chatbotContext.findPublicFields.mockResolvedValue({
      filters: { maxPrice: 5000 },
      fields: [{
        id: 'field-5k',
        name: 'FieldNow Demo Tennis 20',
        pricePerHour: 5000,
        location: 'Hải Châu, Đà Nẵng',
        type: 'TENNIS',
      }],
    });

    const result = await chatbotService.handleMessage({
      message: 'có sân nào 5k ko?',
      user: null,
    });

    expect(result.intent).toBe('field_search');
    expect(chatbotContext.findPublicFields).toHaveBeenCalledWith('có sân nào 5k ko?', null);
    expect(result.suggestedActions).toEqual([{ label: 'Xem FieldNow Demo Tennis 20', path: '/san/field-5k' }]);
  });

  it('replaces contradictory no-result AI answer when DB context has fields', async () => {
    groqClient.createChatCompletion.mockResolvedValue('Không có sân nào giá 5k/1h.');
    chatbotContext.findPublicFields.mockResolvedValue({
      filters: { maxPrice: 5000 },
      fields: [{
        id: 'field-5k',
        name: 'FieldNow Demo Tennis 20',
        pricePerHour: 5000,
        location: 'Hải Châu, Đà Nẵng',
        type: 'TENNIS',
      }],
    });

    const result = await chatbotService.handleMessage({
      message: 'có sân nào giá 5k/1h ko?',
      user: null,
    });

    expect(result.answer).toContain('Có 1 sân phù hợp');
    expect(result.answer).toContain('FieldNow Demo Tennis 20');
    expect(result.answer).not.toContain('Không có sân');
    expect(result.suggestedActions).toEqual([{ label: 'Xem FieldNow Demo Tennis 20', path: '/san/field-5k' }]);
  });

  it('blocks owner intents for non-owner users', async () => {
    const result = await chatbotService.handleMessage({
      message: 'Chủ sân xem slot nào còn trống hôm nay',
      user: { userId: 'user-1', role: 'USER' },
    });

    expect(result.intent).toBe('owner_insights');
    expect(result.answer).toContain('không có quyền');
    expect(groqClient.createChatCompletion).not.toHaveBeenCalled();
  });

  it('allows owner read-only insights for owner users', async () => {
    chatbotContext.findOwnerInsights.mockResolvedValue({
      fields: [{ id: 'field-1', name: 'Sân Owner' }],
      bookings: [],
      cashPayments: [],
      summary: { confirmedBookings: 0, pendingBookings: 0, openSlots: 4 },
    });

    const result = await chatbotService.handleMessage({
      message: 'Chủ sân hôm nay nên xem gì?',
      user: { userId: 'owner-1', role: 'OWNER' },
    });

    expect(result.intent).toBe('owner_insights');
    expect(result.scope).toBe('owner');
    expect(chatbotContext.findOwnerInsights).toHaveBeenCalledWith('owner-1', 'Chủ sân hôm nay nên xem gì?');
    expect(result.suggestedActions).toEqual([{ label: 'Xem dashboard owner', path: '/owner' }]);
  });

  it('answers owner revenue questions from completed payment summary', async () => {
    groqClient.createChatCompletion.mockResolvedValue('Tổng doanh thu tháng này là 0 đồng vì tất cả booking đều bị hủy.');
    chatbotContext.findOwnerInsights.mockResolvedValue({
      fields: [],
      bookings: [],
      cashPayments: [],
      summary: {
        confirmedBookings: 0,
        pendingBookings: 0,
        openSlots: 0,
        pendingCashPayments: 0,
        monthlyRevenue: 5000,
        monthlyCompletedPayments: 1,
        totalRevenue: 5000,
      },
    });

    const result = await chatbotService.handleMessage({
      message: 'tổng doanh thu tháng này là bao nhiêu?',
      user: { userId: 'owner-1', role: 'OWNER' },
    });

    expect(result.intent).toBe('owner_insights');
    expect(chatbotContext.findOwnerInsights).toHaveBeenCalledWith(
      'owner-1',
      'tổng doanh thu tháng này là bao nhiêu?'
    );
    expect(result.answer).toContain('5.000đ');
    expect(result.answer).toContain('1 thanh toán thành công');
    expect(result.answer).not.toContain('0 đồng');
  });

  it('routes admin revenue questions to system-wide admin insights', async () => {
    groqClient.createChatCompletion.mockResolvedValue('Doanh thu tháng này là 0 đồng.');
    chatbotContext.findAdminInsights.mockResolvedValue({
      summary: {
        monthlyRevenue: 5000,
        totalUsers: 12,
        activeUsers: 10,
        inactiveUsers: 2,
        totalFields: 20,
        activeFields: 18,
        inactiveFields: 2,
        totalBookings: 9,
        pendingBookings: 2,
        confirmedBookings: 4,
        cancelledBookings: 3,
        completedPayments: 6,
        pendingPayments: 1,
      },
    });

    const result = await chatbotService.handleMessage({
      message: 'doanh thu tháng này là bao nhiêu?',
      user: { userId: 'admin-1', role: 'ADMIN' },
    });

    expect(result.intent).toBe('admin_insights');
    expect(chatbotContext.findAdminInsights).toHaveBeenCalledWith('doanh thu tháng này là bao nhiêu?');
    expect(chatbotContext.findOwnerInsights).not.toHaveBeenCalled();
    expect(result.answer).toBe('Doanh thu toàn hệ thống tháng này là 5.000đ, tính từ các thanh toán COMPLETED.');
    expect(result.suggestedActions).toEqual([{ label: 'Xem dashboard admin', path: '/admin' }]);
  });

  it('answers admin user count from role summary', async () => {
    chatbotContext.findAdminInsights.mockResolvedValue({
      summary: {
        monthlyRevenue: 0,
        totalUsers: 12,
        activeUsers: 10,
        inactiveUsers: 2,
        roleCounts: [
          { role: 'ADMIN', count: 1 },
          { role: 'OWNER', count: 4 },
          { role: 'USER', count: 7 },
        ],
        totalFields: 20,
        activeFields: 18,
        inactiveFields: 2,
        totalBookings: 9,
        pendingBookings: 2,
        confirmedBookings: 4,
        cancelledBookings: 3,
        completedPayments: 6,
        pendingPayments: 1,
      },
    });

    const result = await chatbotService.handleMessage({
      message: 'có bao nhiêu người dùng?',
      user: { userId: 'admin-1', role: 'ADMIN' },
    });

    expect(result.intent).toBe('admin_insights');
    expect(result.answer).toContain('12 tài khoản');
    expect(result.answer).toContain('ADMIN: 1');
    expect(result.answer).toContain('OWNER: 4');
    expect(result.answer).toContain('USER: 7');
  });
});
