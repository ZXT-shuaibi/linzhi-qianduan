import { FormEvent, useState } from "react";
import { topicOptions } from "../data/mockData";
import { todoApi } from "../services/todoApi";

function CreatePage() {
  const [selectedTopic, setSelectedTopic] = useState(topicOptions[0].label);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [customTopic, setCustomTopic] = useState("");
  const [topics, setTopics] = useState(topicOptions.map((item) => item.label));
  const [uploaded, setUploaded] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("发布接口待接入，当前先保留页面体验。");

  const handleAddTopic = () => {
    const trimmed = customTopic.trim();
    if (!trimmed || topics.includes(trimmed)) {
      return;
    }
    setTopics((current) => [...current, trimmed]);
    setSelectedTopic(trimmed);
    setCustomTopic("");
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    const result = await todoApi.publishPost({ topic: selectedTopic, title, content });
    setSubmitting(false);
    setMessage(result.message);
    setTitle("");
    setContent("");
    setUploaded(false);
  };

  return (
    <section className="composer-layout">
      <form className="composer-panel" onSubmit={handleSubmit}>
        <div className="section-heading">
          <span className="hero-tag">发布中心</span>
          <h2>把原型里的大弹窗改成了独立创作页，后续接发布接口更顺手。</h2>
        </div>

        <div className="upload-panel" onClick={() => setUploaded((current) => !current)}>
          <div className={`upload-preview ${uploaded ? "upload-preview-ready" : ""}`}>
            {uploaded ? "示意图已就绪" : "点击模拟上传封面"}
          </div>
          <p className="muted">TODO：后续替换成真实 OSS / 文件上传接口。</p>
        </div>

        <div className="chip-list">
          {topics.map((topic) => (
            <button
              key={topic}
              type="button"
              className={selectedTopic === topic ? "chip chip-active" : "chip"}
              onClick={() => setSelectedTopic(topic)}
            >
              #{topic}
            </button>
          ))}
        </div>

        <div className="inline-field">
          <input
            value={customTopic}
            onChange={(event) => setCustomTopic(event.target.value)}
            placeholder="输入自定义主题"
          />
          <button type="button" className="soft-button" onClick={handleAddTopic}>
            添加主题
          </button>
        </div>

        <label className="field">
          <span>标题</span>
          <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="给这条内容起一个好标题" />
        </label>

        <label className="field">
          <span>正文</span>
          <textarea
            rows={8}
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder="详细写下你想分享的事、要转让的物品，或需要邻居帮忙的内容。"
          />
        </label>

        <button type="submit" className="primary-button wide-button" disabled={submitting}>
          {submitting ? "发布中..." : "立即发布"}
        </button>
      </form>

      <aside className="preview-panel">
        <div className="section-card">
          <h3>实时预览</h3>
          <div className="preview-card">
            <span className="tone-pill tone-orange">{selectedTopic}</span>
            <h3>{title || "这里会显示你的标题"}</h3>
            <p>{content || "你在左侧输入的内容，会在这里先看到整体信息密度和版式感觉。"}</p>
            <div className="author-row">
              <div className="avatar-badge">我</div>
              <div>
                <strong>当前登录用户</strong>
                <span>发布接口待接入</span>
              </div>
            </div>
          </div>
        </div>

        <div className="section-card warm-card">
          <h3>状态说明</h3>
          <p>{message}</p>
        </div>
      </aside>
    </section>
  );
}

export default CreatePage;
