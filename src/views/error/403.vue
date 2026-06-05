<template>
  <div class="error-container">
    <div class="error-content">
      <div class="error-code">403</div>
      <div class="error-desc">抱歉，您没有权限访问此页面</div>
      <div class="error-actions">
        <el-button type="primary" @click="goHome">返回首页</el-button>
        <el-button type="primary" @click="gogogo">中转站</el-button>
        <el-button @click="goBack">返回上一页</el-button>
      </div>
    </div>

    <el-dialog
      title="中转站"
      :visible="dialogVisible"
      @close="handleDialogClose"
      width="650px"
      center
      custom-class="sudoku-dialog"
    >
      <div class="sudoku-wrapper">
        <!-- 数独棋盘 -->
        <div class="sudoku-board" :style="gridStyle">
          <div
            v-for="(row, i) in board"
            :key="i"
            class="sudoku-row"
          >
            <div
              v-for="(cell, j) in row"
              :key="j"
              class="sudoku-cell"
              :class="{
                'cell-fixed': !cell.editable,
                'cell-right-border': (j + 1) % 3 === 0 && j !== 8,
                'cell-bottom-border': (i + 1) % 3 === 0 && i !== 8
              }"
            >
              <input
                v-if="cell.editable"
                type="text"
                maxlength="1"
                :value="cell.value"
                @input="onInput(i, j, $event)"
                @keydown="onKeydown($event)"
                class="cell-input"
                placeholder=""
              />
              <span v-else class="cell-fixed-number">{{ cell.value }}</span>
            </div>
          </div>
        </div>

        <!-- 控制栏 -->
        <div class="sudoku-controls">
          <el-button size="small" type="success" plain @click="newGame">new</el-button>
          <el-button size="small" type="warning" plain @click="resetGame">重置</el-button>
          <el-button size="small" type="danger" plain @click="checkSolution">校验</el-button>
          <el-button size="small" type="info" plain @click="clearUserInput">清空</el-button>
        </div>
        <div class="sudoku-tip">
          <i class="el-icon-info"></i> 点击空白格直接输入数字1-9，预设题目不可编辑
        </div>
      </div>
    </el-dialog>
  </div>
</template>
<script>
// 预设题库（0代表空格）
const PUZZLE_LIB = [
  // 经典简单题
  [
    [5, 3, 0, 0, 7, 0, 0, 0, 0],
    [6, 0, 0, 1, 9, 5, 0, 0, 0],
    [0, 9, 8, 0, 0, 0, 0, 6, 0],
    [8, 0, 0, 0, 6, 0, 0, 0, 3],
    [4, 0, 0, 8, 0, 3, 0, 0, 1],
    [7, 0, 0, 0, 2, 0, 0, 0, 6],
    [0, 6, 0, 0, 0, 0, 2, 8, 0],
    [0, 0, 0, 4, 1, 9, 0, 0, 5],
    [0, 0, 0, 0, 8, 0, 0, 7, 9]
  ],
  // 中等难度
  [
    [0, 0, 4, 0, 5, 0, 0, 0, 0],
    [9, 0, 0, 7, 3, 4, 6, 0, 0],
    [0, 0, 3, 0, 2, 1, 0, 4, 9],
    [0, 3, 5, 0, 9, 0, 4, 8, 0],
    [6, 0, 0, 5, 0, 2, 0, 0, 7],
    [0, 7, 9, 0, 4, 0, 1, 6, 0],
    [2, 6, 0, 9, 7, 0, 5, 0, 0],
    [0, 0, 7, 2, 1, 5, 0, 0, 6],
    [0, 0, 0, 0, 8, 0, 9, 0, 0]
  ],
  // 进阶挑战
  [
    [0, 0, 6, 0, 0, 0, 0, 0, 9],
    [0, 7, 0, 0, 4, 2, 0, 6, 0],
    [9, 0, 0, 0, 6, 0, 3, 0, 0],
    [0, 4, 0, 9, 0, 0, 0, 2, 0],
    [2, 0, 9, 0, 0, 0, 6, 0, 8],
    [0, 6, 0, 0, 0, 8, 0, 7, 0],
    [0, 0, 3, 0, 9, 0, 0, 0, 7],
    [0, 1, 0, 6, 3, 0, 0, 9, 0],
    [8, 0, 0, 0, 0, 0, 4, 0, 0]
  ]
];

export default {
  name: 'ForbiddenFour',
  data() {
    return {
      dialogVisible: false,          // 对话框显示状态
      board: [],                     // 存储9x9网格 { value, editable }
      originalPuzzleMatrix: [],     // 当前题目的原始矩阵 (0代表空格)
    };
  },
  computed: {
    gridStyle() {
      // 辅助实现宫格粗边框的视觉效果
      return {
        '--border-color': '#dcdfe6',
        '--strong-border': '#909399'
      };
    }
  },
  mounted() {
    // 初始化一个默认题目（简单题）
    this.initPuzzle(PUZZLE_LIB[0]);
  },
  methods: {
    // 打开对话框时重置游戏状态（新开一局自动刷新题目）
    gogogo() {
      // 随机抽一个题目，让每次打开都有新鲜感
      const randomIndex = Math.floor(Math.random() * PUZZLE_LIB.length);
      this.initPuzzle(PUZZLE_LIB[randomIndex]);
      this.dialogVisible = true;
    },
    // 根据矩阵初始化棋盘 (matrix: 9x9 数字0表示空格)
    initPuzzle(matrix) {
      // 深拷贝原始题目矩阵
      this.originalPuzzleMatrix = matrix.map(row => [...row]);
      const newBoard = [];
      for (let i = 0; i < 9; i++) {
        newBoard[i] = [];
        for (let j = 0; j < 9; j++) {
          const value = matrix[i][j];
          if (value !== 0) {
            // 预设题目数字，不可编辑
            newBoard[i][j] = { value: String(value), editable: false };
          } else {
            // 空格子，可编辑
            newBoard[i][j] = { value: '', editable: true };
          }
        }
      }
      this.board = newBoard;
    },
    // 重置当前题目（清空所有可编辑格子，回到刚打开题目时的状态）
    resetGame() {
      if (!this.originalPuzzleMatrix.length) return;
      const matrix = this.originalPuzzleMatrix;
      for (let i = 0; i < 9; i++) {
        for (let j = 0; j < 9; j++) {
          if (this.board[i][j].editable) {
            this.board[i][j].value = '';
          } else {
            // 确保固定数字不变（预防万一）
            this.board[i][j].value = String(matrix[i][j]);
          }
        }
      }
      this.$message({ type: 'info', message: '已重置至题目初始状态', showClose: true });
    },
    // 新游戏（从题库里随机选新题目）
    newGame() {
      const randomIndex = Math.floor(Math.random() * PUZZLE_LIB.length);
      this.initPuzzle(PUZZLE_LIB[randomIndex]);
      this.$message({ type: 'success', message: '新题目已加载，挑战一下吧~', showClose: true });
    },
    // 清空所有用户填写的内容（仅清空可编辑格子，保留预设数字）
    clearUserInput() {
      for (let i = 0; i < 9; i++) {
        for (let j = 0; j < 9; j++) {
          if (this.board[i][j].editable) {
            this.board[i][j].value = '';
          }
        }
      }
      this.$message({ type: 'info', message: '已清空所有填空区域', showClose: true });
    },
    // 处理输入（仅允许1-9单数字）
    onInput(row, col, event) {
      let val = event.target.value;
      // 过滤非数字，只保留最后一个数字字符
      val = val.replace(/[^1-9]/g, '');
      if (val.length > 1) val = val.charAt(0);
      this.board[row][col].value = val;
    },
    // 键盘辅助：禁止输入非数字按键（但保留删除/退格）
    onKeydown(event) {
      const key = event.key;
      // 允许删除、退格、Tab、箭头等
      if (key === 'Backspace' || key === 'Delete' || key === 'Tab' || key === 'ArrowLeft' || key === 'ArrowRight' || key === 'ArrowUp' || key === 'ArrowDown') {
        return;
      }
      // 只允许数字1-9
      if (!/^[1-9]$/.test(key)) {
        event.preventDefault();
      }
    },
    // 校验数独答案是否正确且完整
    checkSolution() {
      // 1. 先检查是否全部填满
      let allFilled = true;
      for (let i = 0; i < 9; i++) {
        for (let j = 0; j < 9; j++) {
          if (this.board[i][j].editable && (!this.board[i][j].value || this.board[i][j].value === '')) {
            allFilled = false;
            break;
          }
        }
      }
      if (!allFilled) {
        this.$message({ type: 'warning', message: '⚠️ 盘面尚未填满，继续挑战吧！', duration: 2000 });
        return;
      }

      // 2. 构建数字矩阵（字符转数字）
      const matrix = Array(9).fill().map(() => Array(9).fill(0));
      for (let i = 0; i < 9; i++) {
        for (let j = 0; j < 9; j++) {
          const val = this.board[i][j].value;
          if (val && /[1-9]/.test(val)) {
            matrix[i][j] = parseInt(val, 10);
          } else {
            matrix[i][j] = 0;
          }
        }
      }

      // 3. 验证规则: 行、列、宫
      const isValid = (arr) => {
        const nums = arr.filter(v => v !== 0);
        return nums.length === new Set(nums).size;
      };

      // 检查每行
      for (let i = 0; i < 9; i++) {
        if (!isValid(matrix[i])) {
          this.$message({ type: 'error', message: `❌ 第 ${i+1} 行存在重复数字，请调整`, duration: 2000 });
          return;
        }
      }
      // 检查每列
      for (let j = 0; j < 9; j++) {
        const column = matrix.map(row => row[j]);
        if (!isValid(column)) {
          this.$message({ type: 'error', message: `❌ 第 ${j+1} 列存在重复数字，请调整`, duration: 2000 });
          return;
        }
      }
      // 检查每个3x3宫格
      for (let box = 0; box < 9; box++) {
        const startRow = Math.floor(box / 3) * 3;
        const startCol = (box % 3) * 3;
        const block = [];
        for (let i = 0; i < 3; i++) {
          for (let j = 0; j < 3; j++) {
            block.push(matrix[startRow + i][startCol + j]);
          }
        }
        if (!isValid(block)) {
          this.$message({ type: 'error', message: `❌ 第 ${box+1} 宫存在重复数字，请调整`, duration: 2000 });
          return;
        }
      }

      // 所有验证通过
      this.$message({ type: 'success', message: '🎉 完美！数独解答正确，太厉害了！', duration: 3000 });
    },
    goHome() {
      this.$router.push('/dashboard');
    },
    goBack() {
      this.$router.go(-1);
    },
    handleDialogClose() {
      this.dialogVisible=false;
      // 关闭对话框时不需要额外操作，但保留当前进度（下次打开重置新题目）
    }
  }
};
</script>

<style scoped>
.error-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: #f0f2f5;
}
.error-content {
  text-align: center;
  background: #fff;
  padding: 60px 80px;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}
.error-code {
  font-size: 120px;
  font-weight: 700;
  color: #f56c6c;
  line-height: 1;
  margin-bottom: 16px;
}
.error-desc {
  font-size: 18px;
  color: #606266;
  margin-bottom: 32px;
}
.error-actions .el-button {
  margin: 0 8px;
}

/* 数独对话框样式 */
.sudoku-dialog >>> .el-dialog__body {
  padding: 20px 24px 30px;
}
.sudoku-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}
.sudoku-board {
  display: inline-block;
  background-color: #f5f7fa;
  border: 2px solid #5a6b7c;
  border-radius: 6px;
  overflow: hidden;
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.08);
}
.sudoku-row {
  display: flex;
}
.sudoku-cell {
  width: 58px;
  height: 58px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #fff;
  border-right: 1px solid #e4e7ed;
  border-bottom: 1px solid #e4e7ed;
  box-sizing: border-box;
  position: relative;
  transition: all 0.1s;
}
/* 宫格粗线: 右侧每三个加粗，底部每三个加粗 */
.sudoku-cell.cell-right-border {
  border-right: 2px solid #7f8c8d;
}
.sudoku-cell.cell-bottom-border {
  border-bottom: 2px solid #7f8c8d;
}
/* 预设固定数字样式 */
.cell-fixed {
  background-color: #f8f9fc;
}
.cell-fixed-number {
  font-size: 22px;
  font-weight: 600;
  color: #2c3e4e;
  font-family: 'Segoe UI', 'PingFang SC', Roboto, monospace;
}
.cell-input {
  width: 100%;
  height: 100%;
  text-align: center;
  font-size: 22px;
  font-weight: 500;
  border: none;
  outline: none;
  background: transparent;
  color: #409eff;
  font-family: 'Segoe UI', 'PingFang SC', monospace;
  caret-color: #409eff;
}
.cell-input:focus {
  background-color: #ecf5ff;
  box-shadow: inset 0 0 0 1px #409eff;
}
/* 控制栏 */
.sudoku-controls {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  justify-content: center;
  margin-top: 8px;
}
.sudoku-tip {
  font-size: 12px;
  color: #8c8f96;
  background: #f4f6f9;
  padding: 8px 16px;
  border-radius: 32px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.sudoku-tip i {
  font-size: 14px;
  color: #67c23a;
}
/* 响应式小调整 */
@media (max-width: 680px) {
  .sudoku-cell {
    width: 36px;
    height: 36px;
  }
  .cell-fixed-number, .cell-input {
    font-size: 16px;
  }
  .sudoku-controls .el-button {
    padding: 7px 12px;
    font-size: 12px;
  }
}
</style>