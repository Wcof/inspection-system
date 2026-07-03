运行 Vitest 测试：

参数：$ARGUMENTS

```bash
npx vitest run $ARGUMENTS
```

如果未传参数，运行全部测试；如果传入文件路径或测试名，运行匹配的测试。

示例：
- `/test` — 运行全部测试
- `/test src/stores` — 运行 stores 目录下的测试
- `/test inspectionPoint` — 运行名称匹配 inspectionPoint 的测试
