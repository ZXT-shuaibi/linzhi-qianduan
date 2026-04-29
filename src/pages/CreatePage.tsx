import { useRef, useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import MainHeader from "@/components/layout/MainHeader";
import SectionHeader from "@/components/common/SectionHeader";
import TagInput from "@/components/common/TagInput";
import AuthStatus from "@/features/auth/AuthStatus";
import { useAuth } from "@/context/AuthContext";
import { computeSha256, knowpostService, uploadToPresigned } from "@/services/knowpostService";
import styles from "./CreatePage.module.css";

const MAX_IMAGES = 15;

const CreatePage = () => {
  const { tokens } = useAuth();
  const [tags, setTags] = useState<string[]>([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [summary, setSummary] = useState("");
  const [visiblePublic, setVisiblePublic] = useState(true);
  const [aiSummaryEnabled, setAiSummaryEnabled] = useState(false);
  const [aiSummaryLoading, setAiSummaryLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [postId, setPostId] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imageUploading, setImageUploading] = useState(false);
  const [uploadedImgUrls, setUploadedImgUrls] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const ensureDraft = async () => {
    if (postId) return postId;
    const response = await knowpostService.createDraft();
    setPostId(String(response.id));
    return String(response.id);
  };

  const handleSelectImages = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setImageUploading(true);
    setError(null);
    setMessage(null);
    try {
      const id = await ensureDraft();
      const remain = Math.max(0, MAX_IMAGES - uploadedImgUrls.length);
      const picked = Array.from(files).slice(0, remain);
      if (!picked.length) {
        setError(`最多只能上传 ${MAX_IMAGES} 张图片`);
        return;
      }

      for (const file of picked) {
        const ext = file.name.match(/\.[^.]+$/)?.[0] ?? ".jpg";
        const contentType = file.type || "image/jpeg";
        const presign = await knowpostService.presign({
          scene: "knowpost_image",
          postId: id,
          filename: file.name || `image-${Date.now()}${ext}`,
          contentType,
          ext
        });
        await uploadToPresigned(presign.putUrl, presign.headers, file);
        setUploadedImgUrls((current) => [...current, presign.publicUrl ?? presign.putUrl.split("?")[0]]);
      }
      setMessage(`已上传 ${picked.length} 张图片`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "图片上传失败");
    } finally {
      setImageUploading(false);
    }
  };

  const handlePublish = async () => {
    if (!title.trim()) {
      setError("请先填写标题");
      return;
    }
    if (!content.trim()) {
      setError("请先填写正文");
      return;
    }

    setSubmitting(true);
    setError(null);
    setMessage(null);
    try {
      const id = await ensureDraft();
      const file = new File([content], "content.md", { type: "text/markdown" });
      const presign = await knowpostService.presign({
        scene: "knowpost_content",
        postId: id,
        filename: "content.md",
        contentType: "text/markdown",
        ext: ".md"
      });
      const sha256 = await computeSha256(file);
      const { etag } = await uploadToPresigned(presign.putUrl, presign.headers, file);
      await knowpostService.confirmContent(id, {
        objectKey: presign.objectKey,
        etag,
        size: file.size,
        sha256
      });
      await knowpostService.update(id, {
        title: title.trim(),
        tags,
        imgUrls: uploadedImgUrls.length ? uploadedImgUrls : undefined,
        visible: visiblePublic ? "public" : "private",
        description: summary.trim() || undefined
      });
      await knowpostService.publish(id);
      setMessage("发布成功");
    } catch (err) {
      setError(err instanceof Error ? err.message : "发布失败");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleAiSummary = async () => {
    if (aiSummaryEnabled) {
      setAiSummaryEnabled(false);
      return;
    }
    if (!tokens?.accessToken) {
      setError("登录后才能使用 AI 摘要");
      return;
    }
    if (!content.trim()) {
      setError("请先填写正文，再生成摘要");
      return;
    }

    setAiSummaryLoading(true);
    setError(null);
    try {
      const response = await knowpostService.suggestDescription(content, tokens.accessToken);
      setSummary((response.description ?? "").slice(0, 50));
      setAiSummaryEnabled(true);
      setMessage("AI 摘要已生成");
    } catch (err) {
      setError(err instanceof Error ? err.message : "AI 摘要生成失败");
    } finally {
      setAiSummaryLoading(false);
    }
  };

  return (
    <AppLayout
      header={(
        <MainHeader
          headline="创建新内容"
          subtitle="发布流程已对接 linli 的草稿、预签名、内容确认和发布接口"
          rightSlot={<AuthStatus />}
        />
      )}
    >
      <div className={styles.formCard}>
        <SectionHeader title="基础信息" subtitle="标题、正文、图片和标签都会走真实接口" />
        <div className={styles.formGrid}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="title">标题</label>
            <input id="title" className={styles.input} value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className={`${styles.field} ${styles.fullWidth}`}>
            <label className={styles.label}>图片</label>
            <div
              className={styles.uploadBox}
              role="button"
              tabIndex={0}
              onClick={() => fileInputRef.current?.click()}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") fileInputRef.current?.click();
              }}
            >
              <span>{imageUploading ? "正在上传图片..." : "点击上传图片"}</span>
              <small>最多 {MAX_IMAGES} 张，支持 JPG / PNG / SVG</small>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className={styles.fileInputHidden}
                onChange={(e) => handleSelectImages(e.target.files)}
              />
            </div>
            {uploadedImgUrls.length > 0 ? (
              <div className={styles.thumbGrid}>
                {uploadedImgUrls.map((url, index) => (
                  <img key={`${url}-${index}`} src={url} alt="" className={styles.thumb} onClick={() => setPreviewUrl(url)} />
                ))}
              </div>
            ) : null}
          </div>
          <div className={`${styles.field} ${styles.fullWidth}`}>
            <label className={styles.label} htmlFor="content">正文</label>
            <textarea id="content" className={styles.textarea} value={content} onChange={(e) => setContent(e.target.value)} />
          </div>
          <div className={`${styles.field} ${styles.fullWidth}`}>
            <div className={styles.fieldHeader}>
              <label className={styles.label} htmlFor="summary">摘要</label>
              <div className={styles.headActions}>
                <span>AI 摘要</span>
                <div
                  className={`${styles.inlineSwitch} ${aiSummaryEnabled ? styles.inlineSwitchOn : ""}`}
                  role="button"
                  tabIndex={0}
                  aria-pressed={aiSummaryEnabled}
                  onClick={() => void handleToggleAiSummary()}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") void handleToggleAiSummary();
                  }}
                />
                {aiSummaryLoading ? <small className={styles.muted}>生成中...</small> : null}
              </div>
            </div>
            <textarea id="summary" className={styles.textarea} value={summary} onChange={(e) => setSummary(e.target.value)} />
            <small className={summary.trim().length > 50 ? styles.charCountOver : styles.charCount}>{summary.trim().length} / 50</small>
          </div>
          <div className={`${styles.field} ${styles.fullWidth}`}>
            <label className={styles.label} htmlFor="tags">标签</label>
            <TagInput id="tags" value={tags} onChange={setTags} placeholder="输入后按回车添加标签" />
          </div>
          <div className={`${styles.field} ${styles.fullWidth}`}>
            <div
              className={styles.toggle}
              role="button"
              tabIndex={0}
              onClick={() => setVisiblePublic((current) => !current)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") setVisiblePublic((current) => !current);
              }}
            >
              <div>
                <div className={styles.label}>可见范围</div>
                <small>{visiblePublic ? "公开" : "私密"}</small>
              </div>
              <div className={`${styles.switch} ${visiblePublic ? styles.switchOn : ""}`} aria-hidden="true" />
            </div>
          </div>
        </div>
        <div className={styles.actions}>
          <button type="button" className={styles.submit} onClick={() => void handlePublish()} disabled={submitting}>
            {submitting ? "发布中..." : "发布"}
          </button>
        </div>
        {error ? <div className={styles.error}>{error}</div> : null}
        {message ? <div className={styles.success}>{message}</div> : null}
        {previewUrl ? (
          <div className={styles.previewOverlay} onClick={() => setPreviewUrl(null)}>
            <img src={previewUrl} className={styles.previewImage} alt="预览" />
          </div>
        ) : null}
      </div>
    </AppLayout>
  );
};

export default CreatePage;
