# JEV-Latest 模型验证报告

## 📋 验证结果

### ❌ 无法调用 jev-latest 模型

**发现：**
- ✅ 模型存在于 https://api.openmodel.ai
- ✅ API Key 有效
- ❌ 但无法通过任何标准端点调用

**模型信息：**
```json
{
  "id": "jev-latest",
  "object": "model",
  "created": 1790156279,
  "owned_by": "typesafe",
  "supported_protocols": [
    "system_one"
  ],
  "client_offers": []
}
```

**关键问题：**
- `supported_protocols: ["system_one"]` - 使用非标准协议
- 不支持 OpenAI 兼容的 `/v1/chat/completions` 端点
- 需要特殊的 `system_one` 协议客户端

---

## 🔍 测试过的端点（全部失败）

```
❌ /v1/chat/completions
❌ /v1/completions
❌ /v1/system-one/chat
❌ /v1/system-one/completions
❌ /system-one
❌ /system-one/chat
❌ /jev/chat
❌ /v1/jev
```

所有端点均返回：
```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "NOT_FOUND",
    "msg": "route not found"
  }
}
```

---

## 💡 推断

### System One 协议是什么？

根据之前的验证报告，`system_one` 是：
- OpenModel.ai 的专有协议
- 不同于标准 OpenAI API
- 可能需要特殊的 SDK 或客户端库

**之前的经验（来自 jev-capability-verification-report.md）：**
> "Model 'jev-1.13' is not supported on OpenCode standard gateway (jev models require System One endpoint)"

这说明：
1. JEV 模型需要 System One 专属端点
2. 标准 gateway 不支持
3. 可能需要联系 OpenModel.ai 获取文档

---

## 🎯 结论与建议

### 结论

**jev-latest 暂时无法使用**，原因：
- 需要 System One 协议支持
- 公开 API 文档未提供该协议的调用方式
- 可能需要特殊权限或 SDK

### 建议

#### 方案 A：继续使用 DeepSeek（推荐）✅

**理由：**
- 已验证可用
- 性能优秀（5.7s 平均延迟）
- 成本极低（$0.01/1M tokens）
- Judge 层效果已验证

**配置：**
```yaml
jev:
  models:
    judge: deepseek-v4.1-flash
    evaluator: deepseek-v4.1-flash
    validator: deepseek-v4.1-flash

routing:
  private_models:
    deepseek-v4.1-flash:
      base_url: http://172.87.28.157:8080
      api_key_env: DEEPSEEK_API_KEY
```

#### 方案 B：联系 OpenModel.ai 获取文档

需要询问：
1. System One 协议的调用方式
2. jev-latest 的 API 端点
3. 是否需要特殊 SDK
4. 是否需要额外权限

#### 方案 C：尝试其他可用模型

如果 OpenModel.ai 上有其他 OpenAI 兼容模型，可以尝试：
```bash
# 查看所有模型
curl -X GET https://api.openmodel.ai/v1/models \
  -H "Authorization: Bearer om-Ev7YMLYvf48zUXD3RdKr1HGUNXxLchZ1JFCy98ZHVWMA" \
  | jq '.data[] | select(.supported_protocols[] == "messages" or .supported_protocols[] == "chat")'
```

---

## 📊 对比：DeepSeek vs JEV-Latest（理论）

| 维度 | DeepSeek v4.1 | JEV-Latest (理论) |
|------|---------------|-------------------|
| 可用性 | ✅ 立即可用 | ❌ 无法调用 |
| 协议 | ✅ OpenAI 兼容 | ❌ System One (专有) |
| 延迟 | ✅ 5.7s | ❓ 未知 |
| 成本 | ✅ $0.01/1M | ❓ 未知 |
| Judge 准确性 | ✅ 已验证优秀 | ❓ 未测试 |
| 风险识别 | ✅ 详细且可操作 | ❓ 未测试 |

---

## 🚀 下一步行动

### 立即可做（推荐）

**继续使用 DeepSeek 完成 MVP**
- ✅ Judge 层已验证成功
- ⏭️ 实现 Evaluator 层
- ⏭️ 实现 Validator 层
- ⏭️ 包装成完整 CLI

### 中期可做（可选）

**等待 jev-latest 文档**
- 联系 OpenModel.ai 技术支持
- 获取 System One 协议文档
- 如果可用，作为 DeepSeek 的备选方案

### 长期架构

**混合架构**
```yaml
routing:
  rules:
    - task_types: [jev_judge, jev_evaluator, jev_validator]
      primary: deepseek-v4.1-flash
      fallback: [jev-latest]  # 未来如果可用
```

---

## 📝 测试日志

**测试时间：** 2025-10-20 07:20

**API Key：** om-Ev7YMLYvf48zUXD3RdKr1HGUNXxLchZ1JFCy98ZHVWMA

**测试脚本：** /tmp/test-jev-latest.sh

**完整输出：** 见上文「测试过的端点」章节
