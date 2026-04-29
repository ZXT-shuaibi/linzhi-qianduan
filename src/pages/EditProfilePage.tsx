import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import MainHeader from "@/components/layout/MainHeader";
import SectionHeader from "@/components/common/SectionHeader";
import TagInput from "@/components/common/TagInput";
import AuthStatus from "@/features/auth/AuthStatus";
import { useAuth } from "@/context/AuthContext";
import { profileService } from "@/services/profileService";
import type { Gender, ProfileUpdateRequest } from "@/types/profile";
import styles from "./EditProfilePage.module.css";

const genderOptions: Array<{ label: string; value: Gender }> = [
  { label: "未设置", value: "unknown" },
  { label: "男", value: "male" },
  { label: "女", value: "female" },
  { label: "其他", value: "other" }
];

const EditProfilePage = () => {
  const { user, reloadUser } = useAuth();
  const navigate = useNavigate();

  const [nickname, setNickname] = useState("");
  const [bio, setBio] = useState("");
  const [gender, setGender] = useState<Gender>("unknown");
  const [birthday, setBirthday] = useState("");
  const [school, setSchool] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setNickname(user?.nickname ?? "");
    setBio(user?.bio ?? "");
    setGender(user?.gender ?? "unknown");
    setBirthday(user?.birthday ?? "");
    setSchool(user?.school ?? "");
    setTags(user?.tags ?? user?.skills ?? []);
    setAvatarUrl(user?.avatar ?? null);
  }, [user]);

  const displayName = nickname.trim() || user?.nickname || user?.phone || user?.account || "邻知用户";
  const avatarInitial = displayName.trim().charAt(0).toUpperCase() || "知";

  const handleAvatarChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setMessage(null);
    try {
      const result = await profileService.uploadAvatar(file);
      setAvatarUrl(result.avatar ?? null);
      await reloadUser();
      setMessage("头像已更新");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "头像上传失败");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    const payload: ProfileUpdateRequest = {
      nickname: nickname.trim() || undefined,
      bio: bio.trim() || undefined,
      gender,
      birthday: birthday || undefined,
      school: school.trim() || undefined,
      tags
    };
    try {
      await profileService.update(payload);
      await reloadUser();
      setMessage("资料已保存");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "保存失败");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppLayout
      variant="cardless"
      header={(
        <MainHeader
          headline="编辑资料"
          subtitle="只提交 linli 当前后端真正支持的资料字段"
          rightSlot={<AuthStatus />}
        />
      )}
    >
      <form className={styles.pageCard} onSubmit={onSubmit}>
        <SectionHeader
          title="基础信息"
          subtitle="头像、昵称、学校、标签等都会直接保存到 /api/v1/profile/me"
          actions={(
            <>
              <button type="button" className="ghost-button" onClick={() => navigate("/profile")}>返回</button>
              <button type="submit" className="ghost-button" disabled={saving}>{saving ? "保存中..." : "保存修改"}</button>
            </>
          )}
        />

        <div className={styles.grid}>
          <div className={styles.avatarPanel}>
            <div
              className={styles.avatarPreview}
              onClick={() => fileInputRef.current?.click()}
              role="button"
              tabIndex={0}
              aria-label="上传头像"
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  fileInputRef.current?.click();
                }
              }}
            >
              {avatarUrl ? <img src={avatarUrl} alt="头像" className={styles.avatarImg} /> : <span>{avatarInitial}</span>}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              style={{ display: "none" }}
            />
            <span>{uploading ? "头像上传中..." : "点击头像更换图片"}</span>
          </div>

          <div className={styles.fieldGroup}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="nickname">昵称</label>
              <input id="nickname" className={styles.input} value={nickname} onChange={(e) => setNickname(e.target.value)} />
            </div>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="account">账号</label>
              <input id="account" className={styles.input} value={user?.account ?? ""} disabled readOnly />
            </div>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="phone">手机号</label>
              <input id="phone" className={styles.input} value={user?.phone ?? ""} disabled readOnly />
            </div>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="gender">性别</label>
              <select id="gender" className={styles.input} value={gender} onChange={(e) => setGender(e.target.value as Gender)}>
                {genderOptions.map((item) => (
                  <option key={item.value} value={item.value}>{item.label}</option>
                ))}
              </select>
            </div>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="birthday">生日</label>
              <input id="birthday" className={styles.input} type="date" value={birthday} onChange={(e) => setBirthday(e.target.value)} />
            </div>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="school">学校 / 机构</label>
              <input id="school" className={styles.input} value={school} onChange={(e) => setSchool(e.target.value)} />
            </div>
            <div className={`${styles.field} ${styles.fullWidth}`}>
              <label className={styles.label} htmlFor="skills">标签</label>
              <TagInput id="skills" value={tags} onChange={setTags} placeholder="输入后按回车添加" />
            </div>
            <div className={`${styles.field} ${styles.fullWidth}`}>
              <label className={styles.label} htmlFor="bio">个人简介</label>
              <textarea id="bio" className={styles.textarea} value={bio} onChange={(e) => setBio(e.target.value)} />
            </div>
          </div>
        </div>

        <div className={styles.actions}>
          {message ? <span>{message}</span> : null}
        </div>
      </form>
    </AppLayout>
  );
};

export default EditProfilePage;
