# Instructions

## constitution
这是针对 webdb 项目的：
- 使用 Ergonomic Python 风格来编写代码。
- 前后端要有严格的类型标注
- 使用 pydantic 来定义数据模型
- 所有后端生成的 JSON 数据，使用 camlCase格式。
- 不需要用户管理

## 基本思路
这是一个数据库查询工具，用户可以添加一个 dburl ，系统就会连接到数据库，获取数据库的metadata，然后将数据库中的 table , view的信息展示出来，然后用户可以自己输入sql查询，也可以自然语言来生成sql查询。

基本想法：
-首先用户需要登记 dburl 数据库信息。
-获取对应的数据库元数据。
-左侧展示数据库信息 db /  table  / view 
-右侧展示数据元数据详细信息 db详细信息， table详细信息（表信息，表元数据，表数据内容） ，view (基本信息，元数据，数据内容)