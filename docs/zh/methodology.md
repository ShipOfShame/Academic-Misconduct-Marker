# 审查方法与优先级评分

[English](../methodology.md) · [中文网站](https://shipofshame.github.io/Academic-Misconduct-Marker/zh/)

学术不端标记器记录论文报告、公开代码和研究材料中的具体问题。当前记录来自对 Sixun Dong 相关论文的审查。检查方式包括阅读论文、对照公开代码、核对表格数值，以及查阅作者回复。

## 文献参考

- **Pineau et al. (2021) — [Improving Reproducibility in Machine Learning Research (A Report from the NeurIPS 2019 Reproducibility Program)](https://jmlr.org/papers/v22/20-303.html)**. 论文发表后，代码和实验细节仍应接受核查。NeurIPS 的该计划包括代码提交政策、可复现性清单和社区复现挑战。

- **Dodge et al. (2019) — [Show Your Work: Improved Reporting of Experimental Results](https://aclanthology.org/D19-1224/)**. 模型比较需要报告最终测试分数以外的信息。该研究说明，验证结果和超参数搜索预算会影响模型比较的结论。

- **Kapoor and Narayanan (2023) — [Leakage and the reproducibility crisis in machine-learning-based science](https://doi.org/10.1016/j.patter.2023.100804)**. 预处理、模型开发和评估环节都需要检查数据分离。该研究分析了数据泄漏及其对基于机器学习结果的科学结论的影响。

- **Sandve et al. (2013) — [Ten Simple Rules for Reproducible Computational Research](https://doi.org/10.1371/journal.pcbi.1003285)**. 结果应能追溯到输入、软件版本、参数和分析步骤。这对应本项目对来源版本、实验配置和复现材料的检查。

- **ACM — [Artifact Review and Badging](https://www.acm.org/publications/policies/artifact-review-and-badging-current)**. 材料可用性、研究产物的功能完整性、结果的独立验证是不同的评估维度。本项目按具体问题分别记录。

- **COPE — [Core Practices — Post-publication discussions and corrections](https://publicationethics.org/core-practices)**. 期刊应提供发表后讨论和更正研究记录的机制。本项目据此提供问题来源，并在问题得到纠正后更新记录。

每篇论文的问题记录分别列出观察事实、核查版本和原始来源。作者回复和更正情况在对应条目中核对。

## 收录标准

论文须至少存在一项有具体证据、尚未解决的报告不一致、实现问题或材料可用性缺口。只有一般疑问、推测或已全部纠正的问题时，论文不进入当前数据库。

每项已纠正的问题都移出当前数据库。同篇论文如有其他未解决问题，只保留那些问题。

身份记录和论文关联随当前收录范围更新。每条问题列出核查版本、观察事实、标记理由、相关情况与作者回应，以及带具体位置的来源。发布前检查这些字段是否齐全。

## 评分规则：版本 2

| 问题类型 | 默认分值 | 含义 |
|---|---:|---|
| 报告不一致 | 3 | 已记录的数值、文本或报告差异 |
| 实现问题 | 3 | 公开实现的缺陷，或其与论文方法的不一致 |
| 材料可用性缺口 | 2 | 所承诺或所需研究材料存在已记录的获取限制 |

分数用于安排阅读顺序。每篇论文按不同问题类型累加权重，同类问题只计一次，默认最高 8 分。问题得到更正后移出当前数据库，同篇论文的其他未解决问题继续计分。

读者可以把三类问题的权重分别调成 0–5 的整数。无效输入恢复为该类型默认值。修改只作用于当前页面，满分随三个权重之和变化；全设为 0 时，各篇论文均为 0 分。

默认按分数降序排列，同分时按 arXiv 编号排序。日期排序使用最近一次问题核查日期。

## 身份匹配与标记

个人匹配使用经过核验的 Scholar 账户 ID、ORCID、专业身份来源和论文信息。遇到标识符冲突时，优先按冲突处理；只有同名信息的记录保持待核实状态。详见[身份核验记录（英文）](../identity-audit.md)。

红色标记表示已记录的审查对象。橙色标记只用于身份已核实且与当前页面匹配的共同作者；身份未确认的共同作者不显示标记。灰色表示审查对象的页面身份待核实或存在标识符冲突。每个标记链接到相关论文和证据记录。

## 证据、翻译与更正

条目优先引用固定代码提交和明确论文版本。实现问题写明触发条件，材料问题列出公开内容与缺失内容，报告问题列出相互冲突的数值或表述。作者对发布条件、实现方式和更正情况的说明放在对应条目中。

英文事实记录与中文翻译分开存放，论文编号、问题状态、日期、作者、数值与来源保持对应。中英文页面均保留论文英文原标题。英文原记录改变时，指纹检查要求重新核对中文内容。

请通过[证据问题模板](https://github.com/ShipOfShame/Academic-Misconduct-Marker/issues/new?template=evidence.md)提交论文编号、争议条目、版本、支持来源及建议更正。身份问题使用[身份模板](https://github.com/ShipOfShame/Academic-Misconduct-Marker/issues/new?template=identity.md)。维护者核对材料后更新原记录、日期和状态，再同步生成中英文页面。

## 网站发布与隐私

GitHub Pages 从 `main` 分支的 `docs/` 发布网站。英文站位于根路径，中文站位于 `/zh/`。扩展、网站数据和证据页来自同一套事实记录与对应翻译。发布前在本地进行验证和浏览器测试，项目不配置自定义 CI。

网站只从同一站点获取证据快照，搜索和调权在当前页面完成。网站不使用分析追踪或第三方脚本。GitHub 按自身政策处理访问日志，点击来源链接时会访问对应网站。
