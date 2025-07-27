import i18n from "@/i18n";
import React, { useState } from "react";

const UserProfile = ({ user }) => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(
    i18n.global.t("key_欢迎来到用户中心_bddcb9f9")
  );

  const handleSave = () => {
    setLoading(true);
    setMessage(i18n.global.t("key_正在保存用户信息_fb7961cd"));

    setTimeout(() => {
      setLoading(false);
      setMessage(i18n.global.t("key_保存成功_fbd2495e"));
    }, 2000);
  };

  return (
    <div className="user-profile">
      <h1>用户资料</h1>
      <div className="form-group">
        <label>用户名：</label>
        <input
          type="text"
          placeholder={i18n.global.t("key_请输入用户名_08b1fa13")}
        />
      </div>
      <div className="form-group">
        <label>邮箱：</label>
        <input
          type="email"
          placeholder={i18n.global.t("key_请输入邮箱地址_2ba4c815")}
        />
      </div>
      <div className="actions">
        <button onClick={handleSave} disabled={loading}>
          {loading
            ? i18n.global.t("key_保存中_2a33020e")
            : i18n.global.t("key_保存_be5fbbe3")}
        </button>
        <button type="button">取消</button>
      </div>
      <div className="message">{message}</div>
      <div className="tips">
        <p>提示：请确保信息准确无误</p>
        <p>如有问题，请联系客服</p>
      </div>
    </div>
  );
};

export default UserProfile;
