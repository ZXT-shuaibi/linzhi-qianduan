import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import TagInput from "@/components/common/TagInput";
import CommunityTopNav from "@/components/layout/CommunityTopNav";
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
  const [publishedPostId, setPublishedPostId] = useState<string | null>(null);
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
    if (!tokens?.accessToken) {
      setError("请先登录后再上传图片");
      return;
    }

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
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handlePublish = async () => {
    if (!tokens?.accessToken) {
      setError("请先登录后再发布动态");
      return;
    }
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
    setPublishedPostId(null);
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
      setPublishedPostId(id);
      setMessage("发布成功，可以进入详情页查看。");
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
    <main className={styles.shell}>
      <CommunityTopNav locationLabel="发布动态" />

      <section className={styles.composerStage}>
        <aside className={styles.guidePanel}>
          <span>真实发布链路</span>
          <h1>把一条邻里经验发布成可被发现的内容。</h1>
          <p>当前页面使用草稿、对象存储预签名、正文确认、元数据更新和发布接口，不绕过后端流程。</p>
          <div className={styles.flowList}>
            <div><strong>1</strong><span>创建草稿 `/posts/drafts`</span></div>
            <div><strong>2</strong><span>上传图片与 Markdown 正文</span></div>
            <div><strong>3</strong><span>确认内容并发布 `/publish`</span></div>
          </div>
        </aside>

        <div className={styles.composerCard}>
          <div className={styles.cardHeader}>
            <div>
              <span>New Community Post</span>
              <h2>发布动态</h2>
            </div>
            <div className={styles.visibilitySwitch}>
              <button
                type="button"
                className={visiblePublic ? styles.visibilityActive : ""}
                onClick={() => setVisiblePublic(true)}
              >
                公开
              </button>
              <button
                type="button"
                className={!visiblePublic ? styles.visibilityActive : ""}
                onClick={() => setVisiblePublic(false)}
              >
                私密
              </button>
            </div>
          </div>

          <div className={styles.uploadBox} onClick={() => fileInputRef.current?.click()} role="button" tabIndex={0}>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className={styles.fileInputHidden}
              onChange={(event) => void handleSelectImages(event.target.files)}
            />
            <div className={styles.uploadHalo}>
              <span>{uploadedImgUrls.length || "+"}</span>
            </div>
            <strong>{imageUploading ? "正在上传图片..." : "拖入灵感图片或点击上传"}</strong>
            <small>最多 {MAX_IMAGES} 张，图片会通过 `/api/v1/storage/presign` 上传</small>
          </div>

          {uploadedImgUrls.length > 0 ? (
            <div className={styles.thumbGrid}>
              {uploadedImgUrls.map((url, index) => (
                <button key={`${url}-${index}`} type="button" onClick={() => setPreviewUrl(url)}>
                  <img src={url} alt={`已上传图片 ${index + 1}`} />
                </button>
              ))}
            </div>
          ) : null}

          <div className={styles.formGrid}>
            <label className={styles.field}>
              <span>标题</span>
              <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="例如：周末亲子陶艺课体验记录" />
            </label>

            <label className={styles.field}>
              <span>标签</span>
              <TagInput id="tags" value={tags} onChange={setTags} placeholder="输入后按回车添加标签" />
            </label>

            <label className={`${styles.field} ${styles.fullWidth}`}>
              <span>正文 Markdown</span>
              <textarea
                value={content}
                onChange={(event) => setContent(event.target.value)}
                placeholder="写下地点、体验、步骤、注意事项，支持 Markdown。"
              />
            </label>

            <div className={`${styles.field} ${styles.fullWidth}`}>
              <div className={styles.summaryHeader}>
                <span>摘要</span>
                <button type="button" onClick={() => void handleToggleAiSummary()} disabled={aiSummaryLoading}>
                  {aiSummaryLoading ? "生成中..." : aiSummaryEnabled ? "关闭 AI 摘要" : "AI 生成摘要"}
                </button>
              </div>
              <textarea
                value={summary}
                onChange={(event) => setSummary(event.target.value)}
                placeholder="50 字以内，作为 Feed 卡片摘要。"
                className={styles.summaryTextarea}
              />
              <small className={summary.trim().length > 50 ? styles.charCountOver : styles.charCount}>
                {summary.trim().length} / 50
              </small>
            </div>
          </div>

          <div className={styles.actions}>
            <div>
              {error ? <span className={styles.error}>{error}</span> : null}
              {message ? <span className={styles.success}>{message}</span> : null}
            </div>
            <button type="button" className={styles.submit} onClick={() => void handlePublish()} disabled={submitting}>
              {submitting ? "发布中..." : "发布"}
            </button>
          </div>

          {publishedPostId ? (
            <Link className={styles.viewLink} to={`/post/${publishedPostId}`}>查看刚发布的动态</Link>
          ) : null}
        </div>
      </section>

      {previewUrl ? (
        <div className={styles.previewOverlay} onClick={() => setPreviewUrl(null)}>
          <img src={previewUrl} className={styles.previewImage} alt="预览" />
        </div>
      ) : null}
    </main>
  );
};

export default CreatePage;
