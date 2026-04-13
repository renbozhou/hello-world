# hello-world

Hello git

edit 01.

## pre-commit

仓库根目录已提供 `.pre-commit-config.yaml`，覆盖 Python（`w1/backend`）和 TypeScript/前端相关文件（`w1` 下 ts/js/json/yaml/md/css/html）。

本地初始化：

```bash
pip install pre-commit
pre-commit install
```

手动执行一次全量检查：

```bash
pre-commit run --all-files
```

### uv 版本（可选）

如果你希望工具链统一用 `uv`，可直接用下面命令（无需全局安装 `pre-commit`）：

```bash
uv tool run pre-commit install
uv tool run pre-commit run --all-files
```
