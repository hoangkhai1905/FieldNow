import { useEffect, useMemo, useRef, useState } from 'react';
import { Bot, CalendarDays, ChevronDown, Loader2, MessageCircle, Send, ShieldCheck, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { sendChatbotMessage } from '../../api/endpoints';
import useAuth from '../../hooks/useAuth';

const initialMessage = {
	id: 'welcome',
	role: 'assistant',
	content: 'Xin chào, mình có thể hỗ trợ tìm sân, lịch trống, booking và thanh toán trong FieldNow.',
};

const guestPrompts = [
	'Tìm sân futsal gần tôi',
	'Sân nào còn trống tối nay?',
	'Thanh toán như thế nào?',
];

const userPrompts = [
	'Lịch đặt sân của tôi hôm nay',
	'Booking gần nhất thanh toán chưa?',
	'Gợi ý sân cầu lông cho cuối tuần',
];

const ownerPrompts = [
	'Hôm nay sân nào có booking?',
	'Slot nào còn trống?',
	'Có cash payment nào cần xác nhận?',
];

const adminPrompts = [
	'Tổng quan hệ thống hiện tại?',
	'Doanh thu tháng này là bao nhiêu?',
	'Có bao nhiêu người dùng?',
];

const getPrompts = (user) => {
	if (user?.role === 'ADMIN') return adminPrompts;
	if (user?.role === 'OWNER') return ownerPrompts;
	if (user) return userPrompts;
	return guestPrompts;
};

const getScopeLabel = (user) => {
	if (user?.role === 'OWNER') return 'Owner';
	if (user?.role === 'ADMIN') return 'Admin';
	if (user) return 'User';
	return 'Guest';
};

const ChatbotWidget = () => {
	const { user, isAuthenticated } = useAuth();
	const navigate = useNavigate();
	const inputRef = useRef(null);
	const messagesRef = useRef(null);
	const [isOpen, setIsOpen] = useState(false);
	const [messages, setMessages] = useState([initialMessage]);
	const [input, setInput] = useState('');
	const [isSending, setIsSending] = useState(false);
	const prompts = useMemo(() => getPrompts(user), [user]);

	useEffect(() => {
		if (!isOpen || !messagesRef.current) return;

		const scrollFrame = window.requestAnimationFrame(() => {
			if (!messagesRef.current) return;
			messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
		});

		return () => window.cancelAnimationFrame(scrollFrame);
	}, [messages, isSending, isOpen]);

	const submitMessage = async (content) => {
		const trimmed = content.trim();
		if (!trimmed || isSending) return;

		const userMessage = {
			id: `user-${Date.now()}`,
			role: 'user',
			content: trimmed,
		};

		setMessages((current) => [...current, userMessage]);
		setInput('');
		setIsSending(true);

		try {
			const response = await sendChatbotMessage(trimmed);
			setMessages((current) => [
				...current,
				{
					id: `assistant-${Date.now()}`,
					role: 'assistant',
					content: response.answer,
					suggestedActions: response.suggestedActions || [],
					requiresAuth: response.requiresAuth,
				},
			]);
		} catch (error) {
			setMessages((current) => [
				...current,
				{
					id: `error-${Date.now()}`,
					role: 'assistant',
					content: error.message || 'Chatbot đang bận. Vui lòng thử lại sau.',
					isError: true,
				},
			]);
		} finally {
			setIsSending(false);
			window.setTimeout(() => inputRef.current?.focus(), 0);
		}
	};

	const handleSubmit = (event) => {
		event.preventDefault();
		submitMessage(input);
	};

	const handleAction = (path) => {
		setIsOpen(false);
		navigate(path);
	};

	return (
		<div className={`chatbot-widget ${isOpen ? 'chatbot-widget-open' : ''}`}>
			{isOpen && (
				<section className="chatbot-panel" aria-label="FieldNow chatbot">
					<header className="chatbot-header">
						<div className="chatbot-title">
							<span className="chatbot-avatar" aria-hidden="true">
								<Bot size={20} />
							</span>
							<div>
								<strong>FieldNow AI</strong>
								<span>{isAuthenticated ? `${getScopeLabel(user)} mode` : 'Guest mode'}</span>
							</div>
						</div>
						<div className="chatbot-header-actions">
							<span className="chatbot-readonly">
								<ShieldCheck size={14} />
								Read-only
							</span>
							<button type="button" className="chatbot-icon-button" onClick={() => setIsOpen(false)} aria-label="Đóng chatbot">
								<X size={18} />
							</button>
						</div>
					</header>

					<div className="chatbot-prompts" aria-label="Gợi ý câu hỏi">
						{prompts.map((prompt) => (
							<button type="button" key={prompt} onClick={() => submitMessage(prompt)} disabled={isSending}>
								<CalendarDays size={14} />
								{prompt}
							</button>
						))}
					</div>

					<div className="chatbot-messages" ref={messagesRef}>
						{messages.map((message) => (
							<div key={message.id} className={`chatbot-message-row chatbot-message-${message.role}`}>
								<div className={`chatbot-bubble ${message.isError ? 'chatbot-bubble-error' : ''}`}>
									{message.content}
									{message.suggestedActions?.length > 0 && (
										<div className="chatbot-actions">
											{message.suggestedActions.map((action) => (
												<button type="button" key={`${message.id}-${action.path}`} onClick={() => handleAction(action.path)}>
													{action.label}
												</button>
											))}
										</div>
									)}
								</div>
							</div>
						))}
						{isSending && (
							<div className="chatbot-message-row chatbot-message-assistant">
								<div className="chatbot-bubble chatbot-bubble-loading">
									<Loader2 size={16} />
									Đang đọc dữ liệu...
								</div>
							</div>
						)}
					</div>

					<form className="chatbot-input-bar" onSubmit={handleSubmit}>
						<input
							ref={inputRef}
							value={input}
							onChange={(event) => setInput(event.target.value)}
							placeholder="Hỏi về sân, lịch, booking, thanh toán..."
							maxLength={1000}
						/>
						<button type="submit" aria-label="Gửi tin nhắn" disabled={!input.trim() || isSending}>
							<Send size={18} />
						</button>
					</form>
				</section>
			)}

			<button
				type="button"
				className="chatbot-launcher"
				onClick={() => setIsOpen((current) => !current)}
				aria-label={isOpen ? 'Thu gọn chatbot' : 'Mở chatbot'}
			>
				{isOpen ? <ChevronDown size={22} /> : <MessageCircle size={22} />}
			</button>
		</div>
	);
};

export default ChatbotWidget;
