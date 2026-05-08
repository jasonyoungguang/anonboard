export interface GlossaryEntry {
  id: string
  term: string
  shortDef: string
  explanation: string
  sections?: string[]
  formula?: string
  example?: { input: string; output: string }
  relatedTerms?: string[]
  category: 'llm' | 'vector-db' | 'rag' | 'general'
}

export const GLOSSARY: Record<string, GlossaryEntry> = {
  // ===== LLM 基础 =====
  transformer: {
    id: 'transformer',
    term: 'Transformer',
    shortDef: '主流的深度学习序列建模架构',
    explanation:
      'Transformer 由 Vaswani 等人在 2017 年论文《Attention Is All You Need》中提出，是当前几乎所有大语言模型的基础架构。它完全基于 {{self-attention}} 机制，摒弃了传统的循环和卷积结构，实现了高效的并行计算。',
    sections: [
      '核心组成：{{multi-head-attention}} + {{ffn|前馈网络}} + {{layer-norm}} + {{residual-connection}}',
      '编码器-解码器结构：原始设计包含编码器和解码器两部分，GPT 系列仅使用解码器',
      '并行化优势：不同于 RNN 的序列处理，Transformer 可以同时处理所有位置的输入',
      '规模化成功：从 BERT（1.1亿参数）到 GPT-4（估计万亿级参数），Transformer 证明了规模化的有效性',
    ],
    relatedTerms: ['self-attention', 'embedding', 'ffn'],
    category: 'llm',
  },
  token: {
    id: 'token',
    term: 'Token',
    shortDef: '文本处理的最小单元',
    explanation:
      'Token 是大语言模型处理文本的基本单位。模型不直接处理原始文本字符串，而是将文本切分为一系列 Token，每个 Token 对应 {{vocabulary|词表}} 中的一个唯一整数 ID。',
    sections: [
      '分词方式因语言而异：英文通常按子词切分（如 "unhappy" → "un" + "happy"），中文通常按字或词切分',
      '常见分词算法：{{bpe|BPE（字节对编码）}}、{{wordpiece|WordPiece}}、SentencePiece',
      '特殊 Token：[CLS]（分类标记）、[SEP]（分隔标记）、[PAD]（填充标记）用于标记序列结构',
      '一个中文字通常对应 1-2 个 Token，英文单词可能对应 1-4 个 Token',
    ],
    example: {
      input: '"我喜欢机器学习"',
      output: '["我", "喜欢", "机器", "学习"] → [1234, 5678, 2345, 6789]',
    },
    relatedTerms: ['bpe', 'vocabulary', 'tokenization'],
    category: 'llm',
  },
  tokenization: {
    id: 'tokenization',
    term: 'Tokenization (分词)',
    shortDef: '将文本转换为 Token 序列的过程',
    explanation:
      'Tokenization 是将原始文本字符串转换为 {{token|Token}} 序列的过程。这是所有自然语言处理模型的第一步，不同的分词策略会直接影响模型的表现。',
    sections: [
      '字符级分词：每个字符一个 Token，词表小但序列很长',
      '词级分词：每个词一个 Token，无法处理未见过的词（OOV 问题）',
      '子词分词（主流）：在字符和词之间取平衡，{{bpe|BPE}} 和 {{wordpiece|WordPiece}} 是最常用的算法',
      '分词结果直接影响 {{context-window|上下文窗口}} 的有效利用率',
    ],
    relatedTerms: ['token', 'bpe', 'wordpiece'],
    category: 'llm',
  },
  bpe: {
    id: 'bpe',
    term: 'BPE (字节对编码)',
    shortDef: '最常用的子词分词算法',
    explanation:
      'BPE（Byte Pair Encoding）是一种数据压缩算法，被广泛用于 {{token|Token}} 化。它通过迭代合并最频繁出现的字符对来构建 {{vocabulary|词表}}，在词表大小和序列长度之间取得平衡。',
    sections: [
      '初始化：将所有文本拆分为单个字符（或字节）',
      '迭代合并：统计所有相邻字符对的出现频率，将最频繁的对合并为新符号',
      '重复此过程直到达到目标词表大小（通常 30K-50K）',
      'GPT 系列使用 BPE 的改进版本，OpenAI 的 tiktoken 库提供了高效实现',
    ],
    example: {
      input: '训练语料中 "l o w" 出现 5 次，"l o w e r" 出现 2 次',
      output: '合并 "l"+"o" → "lo"，再合并 "lo"+"w" → "low"，最终 "low" 成为一个 Token',
    },
    relatedTerms: ['token', 'wordpiece', 'vocabulary'],
    category: 'llm',
  },
  wordpiece: {
    id: 'wordpiece',
    term: 'WordPiece',
    shortDef: 'Google 开发的子词分词算法',
    explanation:
      'WordPiece 是 Google 为 BERT 模型开发的分词算法，与 {{bpe|BPE}} 思路类似但合并策略不同。它选择使语言模型似然度最大化的合并方案，而非单纯基于频率。',
    sections: [
      '使用 "##" 前缀标记非首位子词，如 "playing" → "play" + "##ing"',
      '与 BPE 的区别：BPE 按频率合并，WordPiece 按似然度增益合并',
      'BERT、DistilBERT 等 Google 模型使用 WordPiece',
    ],
    relatedTerms: ['bpe', 'token'],
    category: 'llm',
  },
  vocabulary: {
    id: 'vocabulary',
    term: '词表 (Vocabulary)',
    shortDef: 'Token 到整数 ID 的映射表',
    explanation:
      '词表是模型已知的所有 {{token|Token}} 的集合，每个 Token 对应一个唯一的整数 ID。模型只能处理词表中存在的 Token。',
    sections: [
      '典型大小：BERT 约 30K，GPT-2 约 50K，GPT-4 约 100K',
      '词表越大，能直接表示的词越多，但 {{embedding|嵌入层}} 参数也越多',
      '未知词（OOV）：不在词表中的词会被拆分为更小的子词 Token',
    ],
    relatedTerms: ['token', 'bpe', 'embedding'],
    category: 'llm',
  },
  embedding: {
    id: 'embedding',
    term: 'Embedding (嵌入)',
    shortDef: '将离散符号映射为连续高维向量',
    explanation:
      'Embedding 是将离散的 {{token|Token}} ID 转换为连续的高维浮点向量的过程。这个向量在 {{semantic-space|语义空间}} 中编码了 Token 的语义信息，使得含义相近的词在空间中距离更近。',
    sections: [
      '本质是一个查找表：{{embedding-dimension}} 维的嵌入矩阵，每行对应一个 Token ID',
      '加上 {{positional-encoding}} 后，向量同时编码了语义和位置信息',
      '在训练过程中，嵌入向量会被不断优化，学习到丰富的语义关系',
      '例如：vec("国王") - vec("男人") + vec("女人") ≈ vec("女王")',
    ],
    example: {
      input: 'Token ID 8901（"向量"）',
      output: '[0.23, -0.15, 0.87, ..., 0.42]（768 维浮点数组）',
    },
    relatedTerms: ['embedding-dimension', 'positional-encoding', 'semantic-space'],
    category: 'llm',
  },
  'positional-encoding': {
    id: 'positional-encoding',
    term: '位置编码',
    shortDef: '为序列中每个位置注入顺序信息',
    explanation:
      '由于 {{self-attention}} 机制本身不感知 Token 的顺序（它同时处理所有位置），位置编码被加到 {{embedding|嵌入向量}} 上，让模型知道每个 Token 在序列中的位置。',
    sections: [
      '原始 {{transformer|Transformer}} 使用正弦/余弦函数生成固定位置编码',
      '现代模型（如 GPT）通常使用可学习的位置嵌入',
      'RoPE（旋转位置编码）是当前流行的方案，支持外推到更长序列',
    ],
    relatedTerms: ['embedding', 'transformer'],
    category: 'llm',
  },
  'embedding-dimension': {
    id: 'embedding-dimension',
    term: '嵌入维度',
    shortDef: '向量空间的维数（如 768、1536）',
    explanation:
      '嵌入维度是 {{embedding|嵌入向量}} 的长度，决定了模型可以编码多少语义信息。维度越高，表达能力越强，但计算和存储成本也越高。',
    sections: [
      'BERT-base：768 维，BERT-large：1024 维',
      'GPT-3：12288 维，text-embedding-3-small：1536 维',
      '在 {{vector-embedding|向量数据库}} 场景中，嵌入维度直接影响索引效率和存储空间',
    ],
    relatedTerms: ['embedding', 'vector-embedding'],
    category: 'llm',
  },
  'self-attention': {
    id: 'self-attention',
    term: '自注意力机制',
    shortDef: 'Token 间动态计算注意力权重',
    explanation:
      '自注意力（Self-Attention）是 {{transformer|Transformer}} 的核心机制。它让序列中的每个 {{token|Token}} 都能"关注"所有其他 Token，并根据相关性动态分配注意力权重，从而捕获丰富的上下文依赖关系。',
    sections: [
      '通过 {{query-key-value|Query、Key、Value}} 三个线性投影矩阵将输入转换为查询、键、值向量',
      '注意力权重 = {{softmax}}(Q × K^T / sqrt(d_k))，然后乘以 V 得到输出',
      '{{multi-head-attention}} 允许模型从不同子空间捕获不同类型的关系',
      '这就是为什么模型能区分"苹果公司发布新品"和"我吃了一个苹果"中"苹果"的不同含义',
    ],
    formula: 'Attention(Q,K,V) = softmax(QK^T / sqrt(d_k)) × V',
    relatedTerms: ['query-key-value', 'multi-head-attention', 'softmax'],
    category: 'llm',
  },
  'query-key-value': {
    id: 'query-key-value',
    term: 'Query / Key / Value',
    shortDef: '注意力机制的三个核心投影矩阵',
    explanation:
      '在 {{self-attention}} 中，每个 {{token|Token}} 的嵌入向量被三个权重矩阵 W_Q、W_K、W_V 分别投影为 Query（查询）、Key（键）、Value（值）向量。',
    sections: [
      'Query（查询）：表示"我在寻找什么信息"，代表当前 Token 的需求',
      'Key（键）：表示"我提供什么信息"，代表每个 Token 的特征标签',
      'Value（值）：表示"我实际包含的信息"，是最终被聚合的内容',
      'Query 和 Key 的点积衡量相关性，经 {{softmax}} 归一化后作为权重，加权求和 Value',
    ],
    example: {
      input: '"猫坐在垫子上" 中 "坐" 的 Query',
      output: '与 "猫" 的 Key 点积最大 → "坐" 高度关注 "猫"（主语关系）',
    },
    relatedTerms: ['self-attention', 'softmax'],
    category: 'llm',
  },
  'multi-head-attention': {
    id: 'multi-head-attention',
    term: '多头注意力',
    shortDef: '多组并行的注意力计算',
    explanation:
      '多头注意力（Multi-Head Attention）将 {{self-attention}} 拆分为多个并行的"头"（Head），每个头独立学习不同类型的注意力模式，最后将结果拼接并线性投影。',
    sections: [
      '每个头使用不同的 {{query-key-value|Q/K/V}} 投影矩阵，关注不同方面的信息',
      '例如：一个头可能关注语法关系，另一个关注语义相似性，第三个关注位置距离',
      'BERT-base 使用 12 个头，GPT-3 使用 96 个头',
      '总计算量与单头注意力相同（每个头的维度 = 总维度 / 头数）',
    ],
    relatedTerms: ['self-attention', 'query-key-value'],
    category: 'llm',
  },
  softmax: {
    id: 'softmax',
    term: 'Softmax 函数',
    shortDef: '将任意实数向量归一化为概率分布',
    explanation:
      'Softmax 函数将一组任意实数值转换为 0 到 1 之间的概率分布，所有输出值的和为 1。它在 {{self-attention}} 中用于将注意力分数转化为权重，在模型最终输出层用于生成下一个 {{token|Token}} 的概率。',
    formula: 'softmax(x_i) = exp(x_i) / sum(exp(x_j))',
    sections: [
      '放大差异：较大的值获得显著更高的概率，较小的值趋近于 0',
      '在注意力机制中：将 Q·K 的原始分数转为概率权重',
      '在输出层：将 logits 转为 {{vocabulary|词表}} 上的概率分布',
      '温度参数（Temperature）可以控制分布的"尖锐"或"平坦"程度',
    ],
    relatedTerms: ['self-attention'],
    category: 'llm',
  },
  ffn: {
    id: 'ffn',
    term: '前馈网络 (FFN)',
    shortDef: 'Transformer 层中的非线性变换模块',
    explanation:
      '前馈网络（Feed-Forward Network）是 {{transformer|Transformer}} 每一层中 {{self-attention}} 之后的组件，由两个线性变换和一个 {{relu-gelu|激活函数}} 组成，为模型提供非线性表达能力。',
    sections: [
      '结构：Linear(d_model → 4*d_model) → {{relu-gelu|GELU}} → Linear(4*d_model → d_model)',
      '中间层的维度通常是模型维度的 4 倍，这提供了更大的表达空间',
      '配合 {{layer-norm}} 和 {{residual-connection}} 使用',
      '有研究表明 FFN 层充当了"知识存储"的角色，记忆了大量事实知识',
    ],
    relatedTerms: ['transformer', 'relu-gelu', 'layer-norm'],
    category: 'llm',
  },
  'relu-gelu': {
    id: 'relu-gelu',
    term: 'ReLU / GELU',
    shortDef: '常用的神经网络激活函数',
    explanation:
      '激活函数为神经网络引入非线性，使其能拟合复杂的函数关系。ReLU（Rectified Linear Unit）和 GELU（Gaussian Error Linear Unit）是最常用的两种。',
    sections: [
      'ReLU：f(x) = max(0, x)，简单高效，但存在"神经元死亡"问题',
      'GELU：平滑版的 ReLU，在 {{transformer|Transformer}} 模型中更常用',
      'GELU 在 0 附近有平滑过渡，而非 ReLU 的硬截断',
      'GPT、BERT 等主流模型均采用 GELU 作为 {{ffn|FFN}} 的激活函数',
    ],
    relatedTerms: ['ffn'],
    category: 'llm',
  },
  'layer-norm': {
    id: 'layer-norm',
    term: 'Layer Normalization',
    shortDef: '层归一化，稳定深层网络训练',
    explanation:
      'Layer Normalization 对每一层的输出进行归一化处理（均值为 0，方差为 1），使深层 {{transformer|Transformer}} 网络的训练更加稳定和高效。',
    sections: [
      '作用：防止中间层的数值过大或过小，避免梯度爆炸或消失',
      '通常与 {{residual-connection}} 配合使用：output = LayerNorm(x + Sublayer(x))',
      'Pre-Norm vs Post-Norm：现代模型倾向于将 LayerNorm 放在子层之前（Pre-Norm）',
    ],
    relatedTerms: ['residual-connection', 'transformer'],
    category: 'llm',
  },
  'residual-connection': {
    id: 'residual-connection',
    term: '残差连接',
    shortDef: '跳跃连接，防止深层网络退化',
    explanation:
      '残差连接（Residual Connection / Skip Connection）将某一层的输入直接加到该层的输出上：output = x + F(x)。这确保了即使堆叠很多层，信息仍能直接跳过某些层传递，避免梯度消失。',
    sections: [
      '在 {{transformer|Transformer}} 中，{{self-attention}} 和 {{ffn|FFN}} 各自有一个残差连接',
      '使得 96 层的 GPT-3 等超深模型也能有效训练',
      '本质是让网络学习"增量"而非完整变换，降低了学习难度',
    ],
    relatedTerms: ['layer-norm', 'transformer'],
    category: 'llm',
  },
  'semantic-space': {
    id: 'semantic-space',
    term: '语义空间',
    shortDef: '词义在高维空间中的数学分布',
    explanation:
      '语义空间是通过 {{embedding|Embedding}} 模型将文本映射到的高维向量空间。在这个空间中，语义相似的文本彼此"靠近"（{{cosine-similarity|余弦相似度}} 高），语义不同的文本彼此"远离"。',
    sections: [
      '同义词和近义词的向量距离较小，反义词距离较大',
      '支持向量运算表达语义关系：king - man + woman ≈ queen',
      '这是 {{vector-embedding|向量数据库}} 进行语义搜索的数学基础',
    ],
    relatedTerms: ['embedding', 'cosine-similarity', 'vector-embedding'],
    category: 'llm',
  },

  // ===== 向量数据库 =====
  'vector-embedding': {
    id: 'vector-embedding',
    term: '向量嵌入',
    shortDef: '将非结构化数据映射为高维向量',
    explanation:
      '向量嵌入是将文本、图片、音频等非结构化数据通过 {{embedding-model|Embedding 模型}} 转换为固定长度的高维浮点向量。这些向量在 {{semantic-space|语义空间}} 中编码了数据的语义信息。',
    sections: [
      '文本嵌入：将句子/段落映射为 {{embedding-dimension}} 维的向量',
      '多模态嵌入：CLIP 等模型可以将文本和图片映射到同一向量空间',
      '嵌入质量直接决定了向量检索的准确性',
    ],
    relatedTerms: ['embedding-model', 'semantic-space', 'embedding-dimension'],
    category: 'vector-db',
  },
  'embedding-model': {
    id: 'embedding-model',
    term: 'Embedding 模型',
    shortDef: '专门用于生成向量表示的模型',
    explanation:
      'Embedding 模型是专门训练来将文本转换为 {{vector-embedding|向量嵌入}} 的神经网络模型。与生成式 LLM 不同，它的输出不是文本，而是一个固定维度的浮点向量。',
    sections: [
      '代表模型：OpenAI text-embedding-3-small（1536 维）、BGE-large-zh（1024 维）',
      '使用对比学习（Contrastive Learning）训练，让相似文本的向量更接近',
      '选择因素：语言支持、维度大小、检索精度、推理速度',
      '可以本地部署（如 sentence-transformers 库）或调用 API',
    ],
    relatedTerms: ['vector-embedding', 'semantic-space'],
    category: 'vector-db',
  },
  'cosine-similarity': {
    id: 'cosine-similarity',
    term: '余弦相似度',
    shortDef: '衡量两个向量方向的一致性',
    explanation:
      '余弦相似度通过计算两个向量夹角的余弦值来衡量它们的相似程度，忽略向量长度（模），只关注方向。它是 {{vector-embedding|向量数据库}} 中最常用的相似度度量方法。',
    formula: 'cos(A, B) = (A · B) / (|A| × |B|)',
    sections: [
      '取值范围 [-1, 1]：1 = 方向完全相同，0 = 正交无关，-1 = 方向完全相反',
      '对向量长度不敏感，适合文本这种长度变化大的数据',
      '计算高效，是 {{ann|ANN}} 搜索中最常用的距离度量之一',
      '与 {{dot-product|点积}} 的关系：归一化向量上两者等价',
    ],
    relatedTerms: ['euclidean-distance', 'dot-product', 'ann'],
    category: 'vector-db',
  },
  'euclidean-distance': {
    id: 'euclidean-distance',
    term: '欧氏距离 (L2)',
    shortDef: '向量空间中的绝对直线距离',
    explanation:
      '欧氏距离（L2 距离）计算两个向量在高维空间中的直线距离。距离越小表示越相似。它同时考虑了方向和大小的差异。',
    formula: 'd(A, B) = sqrt(sum((Ai - Bi)²))',
    sections: [
      '取值范围 [0, ∞)：0 表示完全相同',
      '对向量长度敏感，适合归一化后的向量',
      '与 {{cosine-similarity|余弦相似度}} 的区别：欧氏距离同时考虑方向和大小',
    ],
    relatedTerms: ['cosine-similarity', 'dot-product'],
    category: 'vector-db',
  },
  'dot-product': {
    id: 'dot-product',
    term: '点积 (Dot Product)',
    shortDef: '快速计算向量相似度的运算',
    explanation:
      '点积将两个向量对应元素相乘再求和，同时反映方向和大小的相似性。当向量已归一化时，点积等价于 {{cosine-similarity|余弦相似度}}。',
    formula: 'A · B = sum(Ai × Bi)',
    sections: [
      '计算最为简单高效，无需求模操作',
      '在 {{self-attention}} 中用于计算 Query 和 Key 的相关性',
      '归一化向量上：dot(A, B) = cos(A, B)',
    ],
    relatedTerms: ['cosine-similarity', 'self-attention'],
    category: 'vector-db',
  },
  ann: {
    id: 'ann',
    term: 'ANN (近似最近邻)',
    shortDef: '高效的向量近似搜索算法',
    explanation:
      'ANN（Approximate Nearest Neighbor）是在大规模向量集合中快速找到与查询向量最相似的 K 个结果的算法。它牺牲少量精度换取数量级的速度提升，是向量数据库的核心技术。',
    sections: [
      '精确搜索需要逐一比较所有向量（O(n)），百万级数据时极慢',
      'ANN 通过建立索引将搜索时间降至 O(log n) 甚至 O(1) 级别',
      '常用索引算法：{{hnsw|HNSW}}（基于图）、{{ivf|IVF}}（基于聚类）',
      '召回率（Recall）：ANN 返回的结果中真正最近邻的比例，通常 > 95%',
    ],
    relatedTerms: ['hnsw', 'ivf', 'top-k'],
    category: 'vector-db',
  },
  hnsw: {
    id: 'hnsw',
    term: 'HNSW',
    shortDef: '层次化可导航小世界图索引',
    explanation:
      'HNSW（Hierarchical Navigable Small World）是目前最流行的 {{ann|ANN}} 索引算法。它构建一个多层的近邻图结构，从粗粒度的高层开始搜索，逐步下探到细粒度的底层，实现高效的近似最近邻查找。',
    sections: [
      '多层跳表结构：高层稀疏（长距离跳跃），低层密集（精确搜索）',
      '查询时从最高层的随机入口点开始，贪心地向更近的节点移动',
      '优点：查询速度极快，召回率高，支持动态插入',
      '缺点：内存占用较大，建索引时间较长',
      '被 {{milvus|Milvus}}、{{pgvector|pgvector}}、Qdrant 等主流数据库广泛采用',
    ],
    relatedTerms: ['ann', 'ivf'],
    category: 'vector-db',
  },
  ivf: {
    id: 'ivf',
    term: 'IVF 索引',
    shortDef: '基于聚类的倒排文件索引',
    explanation:
      'IVF（Inverted File Index）先用聚类算法（如 K-Means）将所有向量划分为若干聚类，查询时只搜索距离查询向量最近的几个聚类，大幅减少需要比较的向量数量。',
    sections: [
      '训练阶段：用 K-Means 将向量空间划分为 nlist 个聚类',
      '查询阶段：先找到距离查询最近的 nprobe 个聚类中心，只在这些聚类中搜索',
      '优点：内存效率高，适合超大规模数据集',
      '通常与 PQ（乘积量化）结合使用进一步压缩存储',
    ],
    relatedTerms: ['ann', 'hnsw'],
    category: 'vector-db',
  },
  'top-k': {
    id: 'top-k',
    term: 'Top-K 检索',
    shortDef: '返回最相似的 K 条结果',
    explanation:
      'Top-K 检索是指在向量搜索中，根据 {{cosine-similarity|相似度}} 排序后返回最相似的前 K 条结果。K 值的选择影响检索的精度和召回率平衡。',
    sections: [
      '在 {{rag|RAG}} 系统中，K 通常设为 3-10，取回最相关的文档片段',
      'K 太小可能遗漏重要信息，K 太大会引入噪声并增加 {{context-window|上下文窗口}} 消耗',
      '可配合 {{reranking|重排序}} 进一步优化结果质量',
    ],
    relatedTerms: ['ann', 'cosine-similarity', 'reranking'],
    category: 'vector-db',
  },
  milvus: {
    id: 'milvus',
    term: 'Milvus',
    shortDef: '开源高性能分布式向量数据库',
    explanation:
      'Milvus 是由 Zilliz 开发的开源向量数据库，支持百亿级向量的存储和毫秒级检索。它是目前功能最全面的向量数据库之一。',
    sections: [
      '支持多种索引：{{hnsw|HNSW}}、{{ivf|IVF}}、DiskANN 等',
      '支持标量过滤 + 向量搜索的混合查询',
      '分布式架构，支持水平扩展',
      '提供 Python、Java、Go、Node.js 等多语言 SDK',
    ],
    relatedTerms: ['hnsw', 'ivf', 'ann'],
    category: 'vector-db',
  },
  chroma: {
    id: 'chroma',
    term: 'Chroma',
    shortDef: '轻量级开源向量数据库',
    explanation:
      'Chroma 是一个轻量级的开源 {{vector-embedding|向量数据库}}，专为 AI 应用原型开发设计，API 简洁，几行代码即可上手。',
    sections: [
      '内嵌式部署：可以直接在 Python 进程中运行，无需独立服务',
      '自动向量化：支持内置 {{embedding-model|Embedding 模型}}，传入文本即可',
      '适合快速原型验证和小规模 {{rag|RAG}} 应用',
      '支持持久化存储和客户端/服务端模式',
    ],
    relatedTerms: ['vector-embedding', 'rag'],
    category: 'vector-db',
  },
  pgvector: {
    id: 'pgvector',
    term: 'pgvector',
    shortDef: 'PostgreSQL 的向量搜索扩展',
    explanation:
      'pgvector 是 PostgreSQL 的开源扩展，让传统关系数据库也能存储和检索向量。对于已有 PostgreSQL 基础设施的团队，这是最低成本的向量搜索方案。',
    sections: [
      '支持 {{cosine-similarity|余弦相似度}}、{{euclidean-distance|L2 距离}}、{{dot-product|点积}} 三种距离函数',
      '支持 {{hnsw|HNSW}} 和 IVFFlat 两种索引类型',
      '与 SQL 生态完全兼容，可以在同一查询中混合向量搜索和关系过滤',
      '适合中小规模（百万级以下）向量数据场景',
    ],
    relatedTerms: ['hnsw', 'cosine-similarity'],
    category: 'vector-db',
  },
  pinecone: {
    id: 'pinecone',
    term: 'Pinecone',
    shortDef: '全托管的云向量数据库服务',
    explanation:
      'Pinecone 是一个全托管的云端向量数据库，无需管理基础设施即可使用高性能向量搜索。适合希望快速上线而不想运维数据库的团队。',
    sections: [
      '完全托管：自动处理扩缩容、备份、索引优化',
      '支持 {{ann|ANN}} 搜索 + 元数据过滤',
      '提供免费层（Starter），适合小型项目和原型开发',
      '按使用量付费，对于大规模场景成本需要评估',
    ],
    relatedTerms: ['ann', 'vector-embedding'],
    category: 'vector-db',
  },

  // ===== RAG =====
  rag: {
    id: 'rag',
    term: 'RAG (检索增强生成)',
    shortDef: '结合检索与生成的 AI 应用模式',
    explanation:
      'RAG（Retrieval-Augmented Generation）将 {{vector-embedding|向量检索}} 与大语言模型结合。用户提问后，系统先从知识库中检索相关文档作为上下文，再传给 LLM 生成回答，有效减少 {{llm-hallucination|幻觉}} 问题。',
    sections: [
      '离线阶段：知识文档经 {{chunking|文本分割}} → {{embedding-model|Embedding}} → 存入向量数据库',
      '在线阶段：用户问题向量化 → {{ann|ANN}} 检索 → {{prompt-engineering|Prompt 构造}} → LLM 生成',
      '对比 {{fine-tuning|微调}}：RAG 无需重新训练模型，更新文档即更新知识',
      '核心优势：知识可溯源、实时更新、成本可控',
    ],
    relatedTerms: ['chunking', 'prompt-engineering', 'llm-hallucination'],
    category: 'rag',
  },
  chunking: {
    id: 'chunking',
    term: '文本分割 (Chunking)',
    shortDef: '将长文档切分为语义完整的小片段',
    explanation:
      '文本分割是 {{rag|RAG}} 数据准备阶段的关键步骤。由于 {{embedding-model|Embedding 模型}} 有输入长度限制，且太长的文本会稀释语义信息，需要将长文档切分为较小的片段（Chunk）。',
    sections: [
      '常用策略：按固定字符数切分、按段落切分、按语义切分',
      '片段大小通常为 200-1000 个 {{token|Token}}',
      '{{chunk-overlap|重叠区域}} 确保跨段信息不丢失',
      '切分质量直接影响检索精度：太大会稀释语义，太小会丢失上下文',
    ],
    relatedTerms: ['chunk-overlap', 'token', 'rag'],
    category: 'rag',
  },
  'chunk-overlap': {
    id: 'chunk-overlap',
    term: 'Chunk 重叠',
    shortDef: '相邻片段间保留的重叠区域',
    explanation:
      '在 {{chunking|文本分割}} 时，相邻的 Chunk 之间保留一定长度的重叠文本，确保重要信息不会恰好被切断在两个 Chunk 的边界上。',
    sections: [
      '典型设置：Chunk 大小 500 Token，重叠 50-100 Token',
      '重叠太少可能遗漏边界上下文，重叠太多会增加存储和检索冗余',
      '滑动窗口（Sliding Window）是实现重叠的常用方法',
    ],
    relatedTerms: ['chunking'],
    category: 'rag',
  },
  'prompt-engineering': {
    id: 'prompt-engineering',
    term: 'Prompt 工程',
    shortDef: '设计高质量 LLM 输入提示的技术',
    explanation:
      'Prompt 工程是设计和优化输入给大语言模型的提示文本的技术。在 {{rag|RAG}} 中，Prompt 需要巧妙地将检索到的上下文文档和用户问题组合在一起。',
    sections: [
      'RAG Prompt 模板通常包含：系统指令 + 检索到的上下文 + 用户问题',
      '指令中应明确要求模型"仅基于提供的上下文回答"，以减少 {{llm-hallucination|幻觉}}',
      '需要注意 {{context-window|上下文窗口}} 的限制，合理分配 Token 给上下文和回答',
    ],
    relatedTerms: ['rag', 'context-window', 'llm-hallucination'],
    category: 'rag',
  },
  'context-window': {
    id: 'context-window',
    term: '上下文窗口',
    shortDef: 'LLM 单次处理的最大 Token 数',
    explanation:
      '上下文窗口是大语言模型一次推理中能处理的最大 {{token|Token}} 数。输入（Prompt + 上下文）和输出共享这个窗口。在 {{rag|RAG}} 中需要合理分配。',
    sections: [
      'GPT-3.5：4K/16K Token，GPT-4：8K/32K/128K Token，Claude 3：200K Token',
      '窗口越大，能塞入越多检索文档，但成本和延迟也越高',
      '超出窗口的内容会被截断，因此 {{chunking|文本分割}} 策略非常重要',
    ],
    relatedTerms: ['token', 'rag', 'chunking'],
    category: 'rag',
  },
  'llm-hallucination': {
    id: 'llm-hallucination',
    term: '幻觉 (Hallucination)',
    shortDef: 'LLM 生成看似合理但不真实的内容',
    explanation:
      '幻觉是大语言模型"一本正经地胡说八道"的现象——生成的内容看起来很流畅合理，但实际上是错误或虚构的。这是 LLM 最大的可靠性挑战之一。',
    sections: [
      '原因：模型本质是基于概率预测下一个 {{token|Token}}，而非基于事实推理',
      '类型：事实错误、虚构引用、编造数据、逻辑矛盾',
      '{{rag|RAG}} 是缓解幻觉的主要方案之一：让模型基于真实文档回答',
      '{{grounding|知识锚定}} 技术进一步约束模型只输出有据可查的内容',
    ],
    relatedTerms: ['rag', 'grounding'],
    category: 'rag',
  },
  grounding: {
    id: 'grounding',
    term: 'Grounding (知识锚定)',
    shortDef: '用真实数据源约束 LLM 输出',
    explanation:
      'Grounding 是将 LLM 的输出"锚定"到可验证的真实数据源上，确保生成的内容有据可查。{{rag|RAG}} 是实现 Grounding 的主要技术手段。',
    sections: [
      '在回答中标注信息来源（如引用具体文档段落），便于用户验证',
      'Prompt 中明确指示模型："如果上下文中没有相关信息，请回答不知道"',
      '结合 {{reranking|重排序}} 提高检索准确性，减少无关信息干扰',
    ],
    relatedTerms: ['rag', 'llm-hallucination', 'reranking'],
    category: 'rag',
  },
  reranking: {
    id: 'reranking',
    term: '重排序 (Reranking)',
    shortDef: '对检索结果进行二次精排',
    explanation:
      '重排序是在 {{ann|ANN}} 初步检索（{{top-k|Top-K}}）之后，使用更精确的模型（如 {{cross-encoder|Cross-Encoder}}）对候选结果重新排序，进一步提高相关性。',
    sections: [
      '两阶段检索：先用向量搜索快速召回候选集，再用精排模型重新排序',
      '精排模型同时接收查询和文档，能更准确地判断相关性',
      '虽然增加了延迟，但显著提升了最终结果的质量',
    ],
    relatedTerms: ['top-k', 'cross-encoder', 'ann'],
    category: 'rag',
  },
  'cross-encoder': {
    id: 'cross-encoder',
    term: 'Cross-Encoder',
    shortDef: '精确的文本对相关性判断模型',
    explanation:
      'Cross-Encoder 将查询和文档拼接为一个输入，通过 {{transformer|Transformer}} 模型直接输出相关性分数。相比 {{embedding-model|双塔模型}}（Bi-Encoder），它更精确但更慢。',
    sections: [
      'Bi-Encoder：查询和文档分别编码为向量，通过 {{cosine-similarity|余弦相似度}} 比较——快但粗',
      'Cross-Encoder：查询和文档一起编码，交叉注意力捕获细粒度关系——慢但精',
      '在 {{reranking|重排序}} 中使用 Cross-Encoder 对 Top-K 结果精排是最佳实践',
    ],
    relatedTerms: ['reranking', 'embedding-model'],
    category: 'rag',
  },

  // ===== 通用 =====
  'fine-tuning': {
    id: 'fine-tuning',
    term: '微调 (Fine-tuning)',
    shortDef: '在特定数据上继续训练预训练模型',
    explanation:
      '微调是在预训练的大语言模型基础上，使用特定领域/任务的数据继续训练，让模型适应特定场景。与 {{rag|RAG}} 互补，各有适用场景。',
    sections: [
      '全量微调：更新所有模型参数，效果好但成本极高',
      'LoRA/QLoRA：只训练少量适配参数，大幅降低成本',
      '适用场景：需要改变模型的输出风格、格式或特定领域知识',
      '与 RAG 的区别：微调改变模型"能力"，RAG 提供模型"知识"',
    ],
    relatedTerms: ['rag', 'transformer'],
    category: 'general',
  },
  inference: {
    id: 'inference',
    term: '推理 (Inference)',
    shortDef: '模型接收输入并生成输出的过程',
    explanation:
      '推理是训练好的模型接收输入数据并生成输出的过程。对于 LLM 而言，推理就是逐个 {{token|Token}} 地生成回答。',
    sections: [
      '自回归生成：每次预测一个 Token，将其加入输入序列，再预测下一个',
      '每一步都需要通过整个 {{transformer|Transformer}} 网络的前向传播',
      'KV Cache：缓存中间计算结果避免重复计算，加速生成',
      '推理延迟（{{latency|Latency}}）是生产部署的关键指标',
    ],
    relatedTerms: ['token', 'transformer', 'latency'],
    category: 'general',
  },
  latency: {
    id: 'latency',
    term: '延迟 (Latency)',
    shortDef: '从请求发送到收到响应的时间',
    explanation:
      '延迟是用户发送请求到收到完整响应所经历的时间。在 AI 应用中，延迟主要来自模型 {{inference|推理}} 时间和网络传输时间。',
    sections: [
      '首 Token 延迟（TTFT）：收到第一个输出 Token 的时间，影响用户感知',
      '生成速度：每秒生成的 Token 数（tokens/s），决定完整回答的等待时间',
      '在 {{rag|RAG}} 系统中，还包括向量检索时间（通常 < 50ms）',
    ],
    relatedTerms: ['inference', 'rag'],
    category: 'general',
  },
}
