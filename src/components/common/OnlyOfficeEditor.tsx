import React, { useEffect, useRef, useState } from "react";
import { Modal, Spin, message, Button, Space } from "antd";
import { PrinterOutlined, SaveOutlined, CloseOutlined } from "@ant-design/icons";
import { formTemplateService, OnlyOfficeEditorConfigDto } from "../../services/masterDataService";

declare global {
	interface Window {
		DocsAPI: any;
	}
}

interface OnlyOfficeEditorProps {
	visible: boolean;
	fileName: string;
	onClose: () => void;
}

const OnlyOfficeEditor: React.FC<OnlyOfficeEditorProps> = ({
	visible,
	fileName,
	onClose,
}) => {
	const editorContainerRef = useRef<HTMLDivElement>(null);
	const editorInstanceRef = useRef<any>(null);
	const [loading, setLoading] = useState(true);
	const [editorConfig, setEditorConfig] = useState<OnlyOfficeEditorConfigDto | null>(null);
	const [scriptLoaded, setScriptLoaded] = useState(false);

	// Load OnlyOffice script
	useEffect(() => {
		if (!visible) return;

		const loadScript = async () => {
			try {
				// First get the config to know the document server URL
				const config = await formTemplateService.getEditorConfig(fileName);
				setEditorConfig(config);

				const scriptId = "onlyoffice-api-script";
				let script = document.getElementById(scriptId) as HTMLScriptElement;

				if (!script) {
					script = document.createElement("script");
					script.id = scriptId;
					script.src = `${config.documentServerUrl}/web-apps/apps/api/documents/api.js`;
					script.async = true;

					script.onload = () => {
						setScriptLoaded(true);
						setLoading(false);
					};

					script.onerror = () => {
						message.error("Không thể tải OnlyOffice Document Server. Vui lòng kiểm tra cấu hình.");
						setLoading(false);
					};

					document.head.appendChild(script);
				} else {
					if (window.DocsAPI) {
						setScriptLoaded(true);
					}
					setLoading(false);
				}
			} catch (err) {
				console.error("Failed to load editor config:", err);
				message.error("Không thể tải cấu hình editor");
				setLoading(false);
			}
		};

		loadScript();
	}, [visible, fileName]);

	// Initialize editor when script is loaded
	useEffect(() => {
		if (!scriptLoaded || !editorConfig || !editorContainerRef.current || !visible) return;

		// Wait a bit for the container to be ready
		const initTimer = setTimeout(() => {
			try {
				if (editorInstanceRef.current) {
					editorInstanceRef.current.destroyEditor();
				}

				// Convert config to the format OnlyOffice expects (camelCase to lowercase)
				const config = {
					document: {
						fileType: editorConfig.config.document.fileType,
						key: editorConfig.config.document.key,
						title: editorConfig.config.document.title,
						url: editorConfig.config.document.url,
					},
					documentType: editorConfig.config.documentType,
					editorConfig: {
						callbackUrl: editorConfig.config.editorConfig.callbackUrl,
						lang: editorConfig.config.editorConfig.lang,
						mode: editorConfig.config.editorConfig.mode,
						customization: {
							autosave: editorConfig.config.editorConfig.customization.autosave,
							chat: editorConfig.config.editorConfig.customization.chat,
							comments: editorConfig.config.editorConfig.customization.comments,
							compactHeader: editorConfig.config.editorConfig.customization.compactHeader,
							compactToolbar: editorConfig.config.editorConfig.customization.compactToolbar,
							feedback: editorConfig.config.editorConfig.customization.feedback,
							forcesave: editorConfig.config.editorConfig.customization.forceSave,
							help: editorConfig.config.editorConfig.customization.help,
							hideRightMenu: editorConfig.config.editorConfig.customization.hideRightMenu,
							hideRulers: editorConfig.config.editorConfig.customization.hideRulers,
							integrationMode: editorConfig.config.editorConfig.customization.integrationMode,
							logo: editorConfig.config.editorConfig.customization.logo,
							macrosMode: editorConfig.config.editorConfig.customization.macrosMode,
							mentionShare: editorConfig.config.editorConfig.customization.mentionShare,
							plugins: editorConfig.config.editorConfig.customization.plugins,
							reviewDisplay: editorConfig.config.editorConfig.customization.reviewDisplay,
							toolbarHideFileName: editorConfig.config.editorConfig.customization.toolbarHideFileName,
							toolbarNoTabs: editorConfig.config.editorConfig.customization.toolbarNoTabs,
							uiTheme: "theme-light",
							unit: editorConfig.config.editorConfig.customization.unit,
							zoom: editorConfig.config.editorConfig.customization.zoom,
						},
					},
					height: editorConfig.config.height,
					width: editorConfig.config.width,
					type: editorConfig.config.type,
					events: {
						onDocumentReady: () => {
							console.log("Document is ready");
						},
						onError: (event: any) => {
							console.error("OnlyOffice error:", event);
							// Error codes:
							// -1: Unknown error
							// -2: Download error (connection issue - often temporary)
							// -3: Document cannot be converted
							// -4: Document cannot be downloaded
							// -5: Document cannot be saved
							// -6: Document editing error
							const errorCode = event?.data?.errorCode || event?.data;
							// Ignore temporary connection errors (-2, -4, -5) as they often resolve themselves
							if (errorCode === -2 || errorCode === -4 || errorCode === -5) {
								console.warn("OnlyOffice temporary error (will retry):", errorCode);
								return;
							}
							message.error("Có lỗi xảy ra với document editor");
						},
						onWarning: (event: any) => {
							// Just log warnings, don't show to user
							console.warn("OnlyOffice warning:", event);
						},
						onRequestSaveAs: (event: any) => {
							console.log("Save as requested", event);
						},
					},
				};

				editorInstanceRef.current = new window.DocsAPI.DocEditor(
					"onlyoffice-editor-container",
					config
				);
			} catch (err) {
				console.error("Failed to initialize editor:", err);
				message.error("Không thể khởi tạo editor");
			}
		}, 100);

		return () => {
			clearTimeout(initTimer);
		};
	}, [scriptLoaded, editorConfig, visible]);

	// Cleanup on close
	useEffect(() => {
		if (!visible && editorInstanceRef.current) {
			try {
				editorInstanceRef.current.destroyEditor();
				editorInstanceRef.current = null;
			} catch (err) {
				console.error("Failed to destroy editor:", err);
			}
		}
	}, [visible]);

	const handleSave = () => {
		if (editorInstanceRef.current) {
			// Trigger force save through the editor API
			try {
				const connector = editorInstanceRef.current.getConnector();
				if (connector && connector.callCommand) {
					connector.callCommand(() => {
						// This will trigger the callback with forcesave
						Api.asc_Save();
					});
				}
			} catch (err) {
				// Try alternative method
				message.info("Vui lòng sử dụng Ctrl+S hoặc menu File > Save để lưu");
			}
		}
	};

	const handlePrint = () => {
		if (editorInstanceRef.current) {
			try {
				const connector = editorInstanceRef.current.getConnector();
				if (connector && connector.callCommand) {
					connector.callCommand(() => {
						Api.asc_Print();
					});
				}
			} catch (err) {
				message.info("Vui lòng sử dụng Ctrl+P hoặc menu File > Print để in");
			}
		}
	};

	const handleClose = () => {
		if (editorInstanceRef.current) {
			try {
				editorInstanceRef.current.destroyEditor();
				editorInstanceRef.current = null;
			} catch (err) {
				console.error("Failed to destroy editor:", err);
			}
		}
		onClose();
	};

	return (
		<Modal
			title={
				<Space>
					<span>Chỉnh sửa: {fileName}</span>
				</Space>
			}
			open={visible}
			onCancel={handleClose}
			width="100vw"
			style={{ top: 0, margin: 0, padding: 0, maxWidth: "100vw" }}
			styles={{
				body: { height: "calc(100vh - 110px)", padding: 0, overflow: "hidden" },
				content: { borderRadius: 0 },
				wrapper: { padding: 0 },
				mask: { padding: 0 }
			}}
			wrapClassName="fullscreen-modal"
			footer={
				<Space>
					<Button icon={<SaveOutlined />} onClick={handleSave}>
						Lưu (Ctrl+S)
					</Button>
					<Button icon={<PrinterOutlined />} onClick={handlePrint} type="primary">
						In (Ctrl+P)
					</Button>
					<Button icon={<CloseOutlined />} onClick={handleClose}>
						Đóng
					</Button>
				</Space>
			}
			destroyOnClose
			centered={false}
		>
			{loading ? (
				<div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}>
					<Spin size="large" tip="Đang tải editor..." />
				</div>
			) : (
				<div
					id="onlyoffice-editor-container"
					ref={editorContainerRef}
					style={{ width: "100%", height: "100%" }}
				/>
			)}
		</Modal>
	);
};

export default OnlyOfficeEditor;
