import React, { useEffect, useState } from 'react';
import { Banknote, CheckCircle2, Loader2, ReceiptText } from 'lucide-react';
import { confirmOwnerCashPayment, formatCurrency, getOwnerCashPayments } from '../../api/endpoints';
import Toast from '../../components/ui/Toast';
import Modal from '../../components/common/Modal';

const CashPayments = () => {
	const [payments, setPayments] = useState([]);
	const [status, setStatus] = useState('PENDING');
	const [loading, setLoading] = useState(true);
	const [toast, setToast] = useState(null);
	const [processingId, setProcessingId] = useState('');
	const [pendingCashBookingId, setPendingCashBookingId] = useState('');

	const loadPayments = async () => {
		setLoading(true);
		try {
			const data = await getOwnerCashPayments({ page: 1, limit: 30, status });
			setPayments(data.payments ?? []);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		void loadPayments();
	}, [status]);

	const handleConfirm = async (bookingId) => {
		setPendingCashBookingId(bookingId);
	};

	const confirmCashPayment = async () => {
		const bookingId = pendingCashBookingId;
		if (!bookingId) return;
		setPendingCashBookingId('');
		setProcessingId(bookingId);
		try {
			await confirmOwnerCashPayment(bookingId);
			setToast({ type: 'success', text: 'Đã xác nhận thanh toán tiền mặt' });
			await loadPayments();
		} finally {
			setProcessingId('');
		}
	};

	const glassStyle = {
		background: 'rgba(255, 255, 255, 0.05)',
		border: '1px solid rgba(255, 255, 255, 0.1)',
		borderRadius: '24px',
	};

	return (
		<div className="owner-cash-payments" style={{ color: '#fff' }}>
			<Modal
				isOpen={Boolean(pendingCashBookingId)}
				title="Xác nhận thu tiền?"
				description="Hệ thống sẽ đánh dấu đơn này là đã thanh toán tiền mặt tại sân."
				icon={CheckCircle2}
				variant="success"
				confirmText="Đã thu tiền"
				cancelText="Kiểm tra lại"
				onConfirm={confirmCashPayment}
				onClose={() => setPendingCashBookingId('')}
			/>
			<header className="owner-cash-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '36px', gap: '24px' }}>
				<div>
					<div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 14px', background: 'rgba(16,185,129,0.12)', borderRadius: '999px', color: '#10b981', fontSize: '11px', fontWeight: '900', marginBottom: '18px' }}>
						<Banknote size={14} />
						CASH PAYMENT
					</div>
					<h1 style={{ margin: 0, fontSize: '42px', fontWeight: '950' }}>THANH TOÁN TIỀN MẶT</h1>
					<p style={{ color: '#94a3b8', marginTop: '8px' }}>Xác nhận các đơn đã thu tiền tại sân của bạn.</p>
				</div>
				<select
					className="owner-cash-filter"
					value={status}
					onChange={(event) => setStatus(event.target.value)}
					style={{ background: 'rgba(0,0,0,0.3)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px', padding: '12px 16px', outline: 'none' }}
				>
					<option value="PENDING">CHỜ THU TIỀN</option>
					<option value="COMPLETED">ĐÃ THU TIỀN</option>
				</select>
			</header>

			{toast && <Toast message={toast.text} type={toast.type} onClose={() => setToast(null)} />}

			{loading ? (
				<div style={{ ...glassStyle, padding: '80px', textAlign: 'center' }}>
					<Loader2 className="animate-spin" size={34} color="#F59E0B" />
				</div>
			) : payments.length > 0 ? (
				<div style={{ display: 'grid', gap: '16px' }}>
					{payments.map((payment) => (
						<article key={payment.id} style={{ ...glassStyle, padding: '22px', display: 'grid', gridTemplateColumns: '1.3fr 1fr auto', gap: '20px', alignItems: 'center' }}>
							<div>
								<h3 style={{ margin: '0 0 8px 0', fontSize: '19px', fontWeight: '900' }}>{payment.field?.name || 'Sân'}</h3>
								<p style={{ margin: 0, color: '#94a3b8', fontSize: '13px' }}>
									#{payment.bookingId?.slice(0, 8)} - {payment.booking?.date} - {payment.booking?.startTime} - {payment.booking?.endTime}
								</p>
							</div>
							<div>
								<p style={{ margin: '0 0 6px 0', color: '#94a3b8', fontSize: '12px', fontWeight: '900', textTransform: 'uppercase' }}>Người đặt</p>
								<p style={{ margin: 0, fontWeight: '800' }}>{payment.user?.full_name || payment.user?.email || 'Người dùng'}</p>
								<p style={{ margin: '4px 0 0 0', color: '#94a3b8', fontSize: '12px' }}>{payment.user?.phone_number || payment.user?.email}</p>
							</div>
							<div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
								<div style={{ textAlign: 'right' }}>
									<p style={{ margin: 0, color: '#F59E0B', fontSize: '22px', fontWeight: '950' }}>{formatCurrency(payment.amount)}</p>
									<p style={{ margin: 0, color: payment.status === 'COMPLETED' ? '#10b981' : '#94a3b8', fontSize: '12px', fontWeight: '900' }}>{payment.status}</p>
								</div>
								{payment.status === 'PENDING' && (
									<button
										onClick={() => handleConfirm(payment.bookingId)}
										disabled={processingId === payment.bookingId}
										style={{ padding: '13px 16px', borderRadius: '14px', border: 'none', background: '#10b981', color: '#001b12', fontWeight: '950', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', opacity: processingId === payment.bookingId ? 0.65 : 1 }}
									>
										<CheckCircle2 size={16} />
										XÁC NHẬN
									</button>
								)}
							</div>
						</article>
					))}
				</div>
			) : (
				<div className="owner-cash-empty" style={{ ...glassStyle, padding: '80px', textAlign: 'center', color: '#94a3b8', fontWeight: '800' }}>
					<ReceiptText size={38} style={{ marginBottom: '14px' }} />
					<div>Không có thanh toán tiền mặt trong trạng thái này.</div>
				</div>
			)}
		</div>
	);
};

export default CashPayments;
