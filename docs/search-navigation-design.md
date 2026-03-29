# 搜索页面多级菜单返回路径设计

## 一、问题分析

### 当前导航流程问题
```
首页 → 搜索页 → 筛选选择页 → 搜索页(新实例) → 详情页 → ...
        ↑                                    ↓
        └──────── 返回时会先到筛选页 ←───────┘
```

**问题**：每次 `push` 都会增加导航栈深度，返回时需要多次点击。

### 期望的用户体验
1. 搜索页面是"根"页面，保持搜索状态
2. 用户进入筛选页选择后，返回应直接回到搜索页
3. 用户进入详情页后，返回应直接回到搜索页（保留筛选条件）

---

## 二、导航栈管理策略

### 策略对比

| 策略 | 适用场景 | 优点 | 缺点 |
|------|----------|------|------|
| **replace** | 单向流程 | 不增加栈深度 | 无法回到上一级 |
| **push** | 需要回退 | 保留完整历史 | 栈深度增加 |
| **navigate** | 智能跳转 | 已存在则返回 | 需要精确控制 |
| **dismiss** | Modal场景 | 关闭覆盖层 | 仅限Modal |

### 推荐方案：混合策略

```
┌─────────────────────────────────────────────────────────────┐
│                      导航栈结构                              │
├─────────────────────────────────────────────────────────────┤
│  首页(tabs) ← 搜索页 ← 详情页                               │
│       ↑              ↑                                      │
│       │              │                                      │
│       └──────────────┘ (replace: 筛选页不进栈)              │
└─────────────────────────────────────────────────────────────┘
```

---

## 三、具体实现方案

### 方案A：筛选页使用 replace（推荐）

**适用场景**：筛选选择后不需要再回到筛选页

```typescript
// filter-select/index.tsx
const handleSelect = (itemName: string) => {
  router.replace('/search', {
    keyword: existingKeyword,
    industry: itemName,
    autoSearch: 'true',
  });
};
```

**导航栈变化**：
```
搜索页 → [点击更多] → 筛选页 → [选择] → 搜索页(replace)
                                    ↓
                            导航栈: 首页 → 搜索页
```

### 方案B：详情页使用 navigate + 参数回传

**适用场景**：从详情页返回时需要保留搜索条件

```typescript
// search/index.tsx - 进入详情页
const handleBidPress = (bidId: number) => {
  router.push('/detail', { 
    id: bidId,
    // 传递搜索上下文，用于返回时恢复
    returnContext: JSON.stringify({
      keyword,
      industry: selectedIndustry,
      province: selectedProvince,
    }),
  });
};

// detail/index.tsx - 返回时
const handleBack = () => {
  if (returnContext) {
    router.replace('/search', JSON.parse(returnContext));
  } else {
    router.back();
  }
};
```

### 方案C：全局导航管理器（高级方案）

**适用场景**：复杂的返回逻辑，需要统一管理

```typescript
// hooks/useSearchNavigation.ts
export function useSearchNavigation() {
  const router = useSafeRouter();
  const [searchContext, setSearchContext] = useState<SearchContext | null>(null);

  // 进入筛选页
  const goToFilter = (type: 'province' | 'industry') => {
    // 保存当前搜索上下文
    setSearchContext({
      keyword,
      industry: selectedIndustry,
      province: selectedProvince,
    });
    router.push('/filter-select', { type, ...searchContext });
  };

  // 从筛选页返回
  const returnFromFilter = (newFilter: { province?: string; industry?: string }) => {
    router.replace('/search', {
      ...searchContext,
      ...newFilter,
      autoSearch: 'true',
    });
  };

  // 进入详情页
  const goToDetail = (bidId: number) => {
    router.push('/detail', {
      id: bidId,
      fromSearch: 'true',
      searchContext: JSON.stringify(searchContext),
    });
  };

  // 从详情页返回
  const returnFromDetail = () => {
    if (searchContext) {
      router.replace('/search', searchContext);
    } else {
      router.back();
    }
  };

  return { goToFilter, returnFromFilter, goToDetail, returnFromDetail };
}
```

---

## 四、推荐的完整方案

### 页面层级与返回规则

```
┌────────────────────────────────────────────────────────────────┐
│ 页面层级              │ 导航方式  │ 返回行为                   │
├────────────────────────────────────────────────────────────────┤
│ 首页 → 搜索页         │ push     │ 返回首页                   │
│ 搜索页 → 筛选页       │ push     │ 选择后 replace 回搜索页    │
│ 搜索页 → 详情页       │ push     │ 返回搜索页（保留状态）     │
│ 详情页 → 更多详情     │ push     │ 返回详情页                 │
│ 详情页 → 拨打电话     │ 系统功能 │ 无导航变化                 │
└────────────────────────────────────────────────────────────────┘
```

### 导航栈示意图

```
用户操作流程：
首页 → 搜索页 → [更多行业] → 筛选页 → [选择] → 搜索页 → 详情页 → 返回

导航栈变化：
1. 首页
2. 首页 → 搜索页 (push)
3. 首页 → 搜索页 → 筛选页 (push)
4. 首页 → 搜索页 (replace，筛选页被替换)
5. 首页 → 搜索页 → 详情页 (push)
6. 首页 → 搜索页 (back，从详情页返回)

最终效果：返回直接回到搜索页，保留搜索状态
```

---

## 五、代码实现

### 1. 搜索页面 (search/index.tsx)

```typescript
// 进入筛选页
const handleProvinceMore = () => {
  router.push('/filter-select', {
    type: 'province',
    keyword,              // 传递当前关键词
    industry: selectedIndustry,
    province: selectedProvince,
  });
};

// 进入详情页
const handleBidPress = (bidId: number) => {
  router.push('/detail', {
    id: bidId,
    // 详情页返回时可以恢复搜索状态
    searchKeyword: keyword,
    searchIndustry: selectedIndustry,
    searchProvince: selectedProvince,
  });
};
```

### 2. 筛选页面 (filter-select/index.tsx)

```typescript
const handleSelect = (itemName: string) => {
  // 关键：使用 replace，不保留筛选页在导航栈中
  router.replace('/search', {
    keyword: existingKeyword,
    industry: filterType === 'industry' ? itemName : existingIndustry,
    province: filterType === 'province' ? itemName : existingProvince,
    autoSearch: 'true',
  });
};
```

### 3. 详情页面 (detail/index.tsx)

```typescript
// 返回按钮
const handleBack = () => {
  router.back(); // 正常返回，导航栈中搜索页还在
};

// 如果需要跳过某些页面直接回到搜索页
const handleBackToSearch = () => {
  router.navigate('/search'); // 智能跳转，如果搜索页在栈中则返回到那里
};
```

---

## 六、特殊情况处理

### 1. 用户点击多次"更多"

```typescript
// 防止重复进入筛选页
const [isNavigating, setIsNavigating] = useState(false);

const handleProvinceMore = () => {
  if (isNavigating) return;
  setIsNavigating(true);
  router.push('/filter-select', { ... });
  // 在 useEffect 中重置
};
```

### 2. 搜索页面状态恢复

```typescript
// 使用 useSafeSearchParams 接收参数并恢复状态
useEffect(() => {
  if (searchParams?.keyword) setKeyword(searchParams.keyword);
  if (searchParams?.industry) setSelectedIndustry(searchParams.industry);
  if (searchParams?.province) setSelectedProvince(searchParams.province);
}, [searchParams]);
```

### 3. 从详情页跳转到其他详情页

```typescript
// 详情页 → 详情页（相关推荐）
const handleRelatedPress = (relatedId: number) => {
  router.push('/detail', {
    id: relatedId,
    // 传递搜索上下文
    searchKeyword,
    searchIndustry,
    searchProvince,
  });
};
```

---

## 七、总结

### 核心原则

1. **筛选页用 replace**：选择后直接替换，不保留筛选页
2. **详情页用 push**：保留导航历史，支持多级详情
3. **参数传递状态**：通过 URL 参数保持搜索上下文
4. **返回用 back/navigate**：根据场景选择，navigate 会智能跳转

### 导航栈深度控制

| 操作 | 栈深度变化 | 说明 |
|------|-----------|------|
| 首页 → 搜索 | +1 | 正常跳转 |
| 搜索 → 筛选 → 选择 | +0 | push + replace，抵消 |
| 搜索 → 详情 | +1 | 正常跳转 |
| 详情 → 返回 | -1 | 回到搜索页 |
| 搜索 → 返回 | -1 | 回到首页 |

### 最终效果

```
用户从首页进入搜索，经过多级操作后，点击返回：
- 详情页 → 搜索页（保留搜索条件）
- 搜索页 → 首页

不会出现：详情页 → 筛选页 → 搜索页 的多余步骤
```
