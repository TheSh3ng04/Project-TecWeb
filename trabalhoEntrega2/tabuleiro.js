// game logic
class Piece {
    constructor(player) {
        this.player = player;
        this.entered_opponent_row = false;
        this.symbol = player;       // O begins in row 0, X begins in row 3
        this.hasMoved = false;      //First move
    }

    copy() {
        const newPiece = new Piece(this.symbol);
        newPiece.hasMoved = this.hasMoved;
        newPiece.entered_opponent_row = this.entered_opponent_row;
        return newPiece;
    }
}


class Tab {
    constructor(cols) {
        this.cols = cols;
        this.rows = 4; 
        this.board = this.generate_board(cols);
        this.X_row_empty = true;
        this.O_row_empty = true;
        this.last_piece_moved = null;
        this.x_piece_count = cols;
        this.o_piece_count = cols;
    }

    generate_board(cols) {
        const board = [];

        for (let i = 0; i < this.rows; i++) {
            const row = [];

            for (let j = 0; j < cols; j++) {
                if (i === 0) {
                row.push(new Piece("O")); // Player O pieces
                } else if (i === this.rows - 1) {
                row.push(new Piece("X")); // Player X pieces
                } else {
                row.push(" "); // empty square
                }
            }
            board.push(row);
        }

        return board;
    }

    readable_board() {
        return this.board.map(row =>
            row.map(cell => (cell instanceof Piece ? cell.symbol : cell))
        );
    }


    copy_board() {
        const newTab = new Tab(this.cols); // create a new Tab instance
        const newBoard = [];
    
        for (let i = 0; i < this.rows; i++) {
            const newRow = [];
            for (let j = 0; j < this.cols; j++) {
                const cell = this.board[i][j];
    
                // Deep copy pieces
                if (cell instanceof Piece) {
                    newRow.push(cell.copy());
                } else {
                    newRow.push(cell);
                }
            }
            newBoard.push(newRow);
        }
    
        newTab.board = newBoard;
        // Copy piece counts
        newTab.x_piece_count = this.x_piece_count;
        newTab.o_piece_count = this.o_piece_count;
        return newTab;
    }



    is_back_row_clear(p_row) {
        if (p_row === 0) {
            for (let i = 0; i < this.cols; i++) {
                if (this.board[p_row][i].symbol === 'O') {
                    this.O_row_empty = false
                    return;
                } 
            }
            this.O_row_empty = true
        }

        if (p_row === 3) {
             for (let i = 0; i < this.cols; i++) {
                if (this.board[p_row][i].symbol === 'X') {
                    this.X_row_empty = false
                    return;
                }
            }
            this.X_row_empty = true
        }  
    }
    //selected_piece is a set of coordenates,
    get_piece_movement_horizontal_direction(p_row) {
        return (p_row % 2 === 0) ? -1 : 1;
    }

    get_piece_movement_vertical_direction(selected_piece, p_end_col) {
        const [p_row, p_col] = selected_piece
        const piece = this.board[p_row][p_col]
        let direction = 0          

        this.is_back_row_clear(0)
        this.is_back_row_clear(3)

        if (p_end_col === 0) {
            if (p_row === 0) {
                direction = 1          //top left corner, moves down
            }
            else if (p_row === 2) {
                if ((piece.symbol === 'O' && (!this.X_row_empty || piece.entered_opponent_row)) || (piece.symbol === "X")){
                    direction = -1
                }
                if (piece.symbol === 'O' && !piece.entered_opponent_row && this.X_row_empty) { 
                    direction = 0
                }
            }
        }
        else if (p_end_col === this.cols - 1) {
            if (p_row === 3) {
                direction = -1        // bottom right corner, move up
            }
            else if (p_row === 1) {
                if ((piece.symbol === 'X' && (!this.O_row_empty || piece.entered_opponent_row)) || (piece.symbol === "O")){
                    direction = 1
                }
                if (piece.symbol === "X" && !piece.entered_opponent_row && this.O_row_empty) {
                    direction = 0    
                }
                
            }
        }
        return direction
    }
 
    // checks if path is blocked given starting location and ending location column
    is_path_blocked(selected_piece, piece_end_col) {
        
        const [p_row, p_col] = selected_piece;
        if (p_row === -1 || p_col === -1) return true;
    
        const h_direction = this.get_piece_movement_horizontal_direction(p_row);
        let remaining_moves = this.get_piece_remaining_move(selected_piece, piece_end_col);
        const piece = this.board[p_row][p_col];
        const range = Math.abs(p_col - piece_end_col);
    
        for (let i = 1; i <= range; i++) {
            const next_col = p_col + i * h_direction;
    
            // Prevent out-of-bounds
            if (next_col < 0 || next_col >= this.cols) break;
    
            const cell = this.board[p_row][next_col];
    
            // For intermediate squares
            if (i < range) {
                if (cell instanceof Piece && cell.symbol !== piece.symbol) {
                    // Can't jump over an opponent piece
                    return true;
                }
            } 
            // For the final square
            else if (i === range) {
                if (cell === ' ') {
                    return false; // legal empty landing
                }
                if (cell instanceof Piece && cell.symbol === piece.symbol)
                    if  (remaining_moves >= 1) {
                        return false; // edgecase, blocked by ally however it can still move vertically
                    } else {
                        return true; //blocked by ally
                    }
                
                if (cell instanceof Piece && cell.symbol !== piece.symbol) {
                    // capture allowed!
                    return false;
                }
            }
        }
        return false;
    }
    
    // calculates if piece gets out of bounds
    is_piece_OFB(selected_piece, value){
        const [p_row, p_col] = selected_piece;
        const h_direction = this.get_piece_movement_horizontal_direction(p_row);
        const final_col = p_col + value * h_direction;
        return (final_col < 0 || final_col >= this.cols) 
    }

    // calculates remaining moves after a piece hits a border
    get_piece_remaining_move(selected_piece, value) {

        if (this.is_piece_OFB(selected_piece, value)) {
            const [p_row, p_col] = selected_piece;
            const h_direction = this.get_piece_movement_horizontal_direction(p_row);
            let distance_to_border = 0;

            if (h_direction === 1) { // Moving Right
                distance_to_border = this.cols - 1 - p_col;
            } else { // h_direction === -1 (Moving Left)
                distance_to_border = p_col; // Distance to column 0
            }
            let remaining_moves = value - distance_to_border;
            return remaining_moves;
        }
        return 0;
    }

    // calculates the ending location of piece col
    get_piece_end_col(selected_piece, value) {
        const [p_row, p_col] = selected_piece;
        if (value === 0) {
            return p_col;
        }      
        const h_direction = this.get_piece_movement_horizontal_direction(p_row);
        let end_location = p_col + (h_direction * value);

        if (this.is_piece_OFB(selected_piece, value)) {
            if (h_direction === 1) { // Moving Right
                end_location = this.cols - 1;
            } else { // h_direction === -1 (Moving Left)
                end_location = 0
            }
        }
        if (!this.is_path_blocked(selected_piece, end_location)){
            return end_location;
        }

        return -1;
    }

    piece_lane_switch(selected_piece, value) {      // returns row, alt row, end col, remaining moves, 
        const [p_row, p_col] = selected_piece;
    
        // Only applies when out-of-bounds horizontally
        if (!this.is_piece_OFB(selected_piece, value)) {
            return [-1, -1, -1, -1];
        }
    
        const piece = this.board[p_row][p_col];
        const remaining_moves = this.get_piece_remaining_move(selected_piece, value);
        const h_dir = this.get_piece_movement_horizontal_direction(p_row);
        const end_col = (h_dir === 1) ? this.cols - 1 : 0; // actual border column
        const direction = this.get_piece_movement_vertical_direction(selected_piece, end_col);
    
        // Ensure we have a valid vertical move
        if (direction !== 0) {
            const new_row = p_row + direction;
            if (new_row < 0 || new_row >= this.rows) return [-1, -1, -1, -1];
    
            const target = this.board[new_row][end_col];
    
            // Allowed if empty, or if capturing opponent and it’s the last move
            if (
                target === " " ||
                (target instanceof Piece && target.symbol !== piece.symbol && remaining_moves === 1) ||
                (target instanceof Piece && target.symbol === piece.symbol && remaining_moves >= 2)
            ) {
                return [new_row, -1, end_col, remaining_moves - 1];
            }
    
            // Blocked by ally
            return [-1, -1, -1, -1];
        }
        else {
        // If direction is 0, both vertical options possible
        const up = (p_row - 1 >= 0) ? p_row - 1 : -1;
        const down = (p_row + 1 < this.rows) ? p_row + 1 : -1;        
        return [down, up, end_col, remaining_moves - 1];
        }
    }
    
    
    
    piece_end_location(selected_piece, value) { // returns row, col, alt row, alt col
        if (this.is_piece_OFB(selected_piece, value)) {
            const [p_new_row, p_new_row_alt, p_new_col, remaining_moves] = this.piece_lane_switch(selected_piece, value);

            if (remaining_moves === -1) return [-1, -1, -1, -1];    //illegal move

            const new_piece = [p_new_row, p_new_col];
            let final_col = this.get_piece_end_col(new_piece, remaining_moves);

            if (p_new_row_alt !== -1) {
                return [p_new_row, final_col, p_new_row_alt, p_new_col]
            }

            return [p_new_row, final_col, -1, -1]
        }
        const final_col = this.get_piece_end_col(selected_piece, value);
        const [p_row, p_col] = selected_piece;
        return [p_row, final_col, -1, -1];
    }   
    
  
    is_move_legal(selected_piece, value) {
        const [original_p_rol, original_p_col] = selected_piece;
        const piece = this.board[original_p_rol][original_p_col]
        if (!piece.hasMoved && value !== 1) return false;
        const [p_row, p_col, p_row_alt, p_col_alt] = this.piece_end_location(selected_piece, value)
        if (p_row < 0 || p_col < 0) return false;
        if (p_row < 0 && p_col < 0 && p_row_alt < 0 && p_col_alt < 0) return false;
        const target = this.board[p_row][p_col];
        if (this.board[p_row][p_col] instanceof Piece && target.symbol === piece.symbol) return false;
 
        
        return true;
    }

    get_possible_moves(symbol, value) {
        const possibleMoves = [];
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                const cell = this.board[row][col];
                if (cell instanceof Piece && cell.symbol === symbol) {
                    if (this.is_move_legal([row, col], value)) {
                        const end_location = this.piece_end_location([row, col], value);
                        if (end_location[2] !== -1 && end_location[3] !== -1) {
                            possibleMoves.push([[row, col], [end_location[2], end_location[3]]])
                        }
                        possibleMoves.push([[row, col], [end_location[0], end_location[1]]]);
                    }
                }
            }
        }
        return possibleMoves;
    }

    move_piece(selected_piece, end_location) {
        const [p_row, p_col] = selected_piece;
        const [new_p_row, new_p_col] = end_location;
    
        const piece = this.board[p_row][p_col];
        const target = this.board[new_p_row][new_p_col];
    
        // Capture logic
        if (target instanceof Piece && target.symbol !== piece.symbol) {
            // Remove captured piece and update counts
            this.board[new_p_row][new_p_col] = " ";
            if (target.symbol === "X") {
                this.x_piece_count--;
            } else if (target.symbol === "O") {
                this.o_piece_count--;
            }
        }
    
        // Move the piece
        this.board[p_row][p_col] = " ";
        this.board[new_p_row][new_p_col] = piece;
    
        // Update piece state if it enters opponent's row
        piece.hasMoved = true;
        if (piece.symbol === "O" && new_p_row === 3) piece.entered_opponent_row = true;
        if (piece.symbol === "X" && new_p_row === 0) piece.entered_opponent_row = true;
        //is_game_won();

        this.last_piece_moved = [p_row, p_col, new_p_row, new_p_col]
    }
    
    get_winner() {
        let x_found = false, o_found = false;
        for (let row of this.board) {
            for (let cell of row) {
                if (cell instanceof Piece) {
                    if (cell.symbol === "X") x_found = true;
                    else if (cell.symbol === "O") o_found = true;
                }
                if (x_found && o_found) return null;
            }
        }
        if (x_found && !o_found) return "X";
        if (o_found && !x_found) return "O";
        return null;
    }

    is_game_won() {
        return this.get_winner() !== null;
    }
}

class MiniMax {
    constructor(board, maximizingPlayer, parent = null, move = null) {
        this.board = board;
        this.maximizingPlayer = maximizingPlayer; // boolean: true for AI, false for opponent
        this.parent = parent;
        this.move = move;
        this.children = [];
    }

    addChild(childNode) {
        this.children.push(childNode);
        childNode.parent = this;
    }

    evaluate(maximizingPlayer) {
        const winner = this.board.get_winner();
        let score = 0;
        if (winner === maximizingPlayer) return 100;
        if (winner && winner !== maximizingPlayer) return -100;
        
        // Piece count difference - prioritize capturing
        const x_count = this.board.x_piece_count;
        const o_count = this.board.o_piece_count;
        
        if (maximizingPlayer === "X") {
            // Positive score means X has more pieces
            score += (x_count - o_count) * 5; // Each piece advantage is worth 5 points
        } else if (maximizingPlayer === "O") {
            // Positive score means O has more pieces
            score += (o_count - x_count) * 5; // Each piece advantage is worth 5 points
        }
        
        // Penalty for unmoved pieces in back row
        const r = maximizingPlayer === "X" ? 3 : 0;
        for (let i = 0; i < this.board.cols; i++) {
            const cell = this.board.board[r][i];
            if (cell instanceof Piece && !cell.hasMoved) {
                score -= 1;
            }
        } 
        return score;
    }

    minimax(depth, alpha, beta, maximizingSymbol, value, rootSymbol) {
        if (depth === 0 || this.board.is_game_won()) {
            return [this.evaluate(rootSymbol), this.board];
        }
    
        const currentSymbol = maximizingSymbol;
        let opponent = maximizingSymbol === "X" ? "O" : "X";
        const possibleMoves = this.board.get_possible_moves(currentSymbol, value);
        
        console.log("POSSIBLE MOVES", possibleMoves)

        // Determine if we're maximizing for the root player
        const isMaximizing = maximizingSymbol === rootSymbol;
        let bestEval = isMaximizing ? -Infinity : Infinity;
        let bestBoard = this.board;
    
        for (let move of possibleMoves) {
            const [start_row, start_col] = move[0];
            const [end_row, end_col] = move[1];
            const newBoard = this.board.copy_board();
            newBoard.move_piece([start_row, start_col], [end_row, end_col]);
            console.log("NEW BOARD", newBoard)
            const child = new MiniMax(newBoard, opponent, this, move);
            console.log("CHILD CALL")
            const result = child.minimax(depth - 1, alpha, beta, opponent, value, rootSymbol);
            console.log("RESULT BEFORE", result)
            console.log("BEST EVAL BEFORE", bestEval)
            
            const evalScore = result[0];
            
            if (isMaximizing) {
                if (evalScore > bestEval) {
                    bestEval = evalScore;
                    bestBoard = newBoard;
                }
                alpha = Math.max(alpha, evalScore);
            } else {
                if (evalScore < bestEval) {
                    bestEval = evalScore;
                    bestBoard = newBoard;
                }
                beta = Math.min(beta, evalScore);
            }
            
            console.log("BEST EVAL AFTER", bestEval)

            if (beta <= alpha) break;
        }
        console.log("HELLO", bestBoard.last_piece_moved, "row col new row new col")
        console.table("MINIMAX", bestBoard.readable_board());

        return [bestEval, bestBoard];
    }
    

    minimaxRun(maximizingSymbol, value, maxDepth = 3) {
        // assuming this.maximizingPlayer starts as true for AI
        console.log("Initializing minimax")
        return this.minimax(maxDepth, -Infinity, Infinity, maximizingSymbol, value, maximizingSymbol);
    }
}



// STICKS LOGIC dont touch kisses xoxo //
function rng() {
    let value = Math.floor(Math.random() * 100)
    if (value <= 5) {
        return 6;
    } else if (value >= 6 && value <= 30) {
        return 1;
    } else if (value >= 31 && value <= 68) {
        return 2;
    } else if (value >= 69 && value <= 94) {
        return 3;
    } else if (value >= 95) {
        return 4;
    }
}

const canvas = document.getElementById("stickCanvas");
const ctx = canvas.getContext("2d", { alpha: true });
ctx.clearRect(0, 0, canvas.width, canvas.height);

// Stick properties
const stickWidth = 10;
const stickHeight = 80;
const stickSpacing = 40;
const startX = 25;
const startY = canvas.height / 2 - stickHeight / 2;

function drawBox() {
    ctx.fillStyle = "rgba(0,0,0,0)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = 'rgba(0, 200, 255, 0.8)';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, canvas.width, canvas.height);
}

function drawSticks(value) {
    sticks = [0, 0, 0, 0]
    if (value <= 4) {
        for (let i = 0; i < value; i++) {
            sticks[i] = 1;
        }
    }

    for (let i = 0; i < 4; i++) {
        const x = startX + i * stickSpacing;
        const y = startY;
        ctx.fillStyle = sticks[i] === 1 ? 'black' : 'white';
        ctx.fillRect(x, y, stickWidth, stickHeight);

        // Draw the border
        ctx.strokeStyle = 'black'; // border color
        ctx.lineWidth = 1;          // border thickness
        ctx.strokeRect(x, y, stickWidth, stickHeight);
    }
}

function updateSticks(value) {
    drawBox();
    drawSticks(value);
    document.getElementById("RollOutput").textContent = updateText(value);
}

function updateText(value) {
    if (value == 1) {
        return "Tâb 1" 
    } else if (value == 2) {
        return "Itneyn 2"
    } else if (value == 3) {
        return "Teláteh 3" 
    } else if (value == 4) {
        return "Arba'ah 4" 
    } else if (value == 6) {
        return "Sitteh 6"
    }
}


// Initial draw, else fica vazio
updateSticks(0);

// END OF STICKS XOXO




// === CLICK + MOVEMENT LOGIC ===

// --- HIGHLIGHT HELPERS ---
function clearHighlights() {
    document.querySelectorAll(".square").forEach(sq => {
        sq.classList.remove("selected", "capture", "move");
    });
}

function highlightSelection(row, col) {
    const selector = `.square[data-row='${row}'][data-col='${col}']`;
    const sq = document.querySelector(selector);
    if (sq) sq.classList.add("selected");
}

function highlightDestinations(selected, value) {
    clearHighlights();
    const [r, c] = selected;
    const piece = playableBoard.board[r][c];

    // highlight selected piece
    highlightSelection(r, c);

    // if no roll, don't highlight destinations
    if (value === 0) return;

    const [endRow, endCol, altRow, altCol] = playableBoard.piece_end_location(selected, value);
    const destinations = [[endRow, endCol], [altRow, altCol]];

    destinations.forEach(([row, col]) => {
        if (row === -1 || col === -1) return;
        const sq = document.querySelector(`.square[data-row="${row}"][data-col="${col}"]`);
        if (!sq) return;

        const cell = playableBoard.board[row][col];
        if (cell === " ") {
            sq.classList.add("move");
        } else if (cell instanceof Piece && cell.symbol !== piece.symbol) {
            sq.classList.add("capture");
        }
    });
}

// --- STATE ---
// --- TURN SYSTEM ---

let rolledValue;
let selectedPiece = null;

// --- CLICK HANDLER ---
function handlePlayerClick(e) {
    const square = e.target;
    if (!square.classList.contains("square")) return false;

    const row = parseInt(square.dataset.row);
    const col = parseInt(square.dataset.col);
    const cell = playableBoard.board[row][col];

    // Selecting a piece
    if (!selectedPiece) {
        if (cell instanceof Piece) {
            if (cell.symbol !== currentPlayer) {
                alert(`It's ${currentPlayer}'s turn!`);
                return false;
            }
            selectedPiece = [row, col];
            highlightDestinations(selectedPiece, rolledValue);
        }
        return false;
    }

    // Must roll first
    if (rolledValue === 0) {
        alert("You must roll first!");
        selectedPiece = null;
        clearHighlights();
        refreshBoard();
        return false;
    }

    // --- Check if move is legal ---
    if (!playableBoard.is_move_legal(selectedPiece, rolledValue)) {
        alert("This piece cannot move with this roll!");
        selectedPiece = null;
        clearHighlights();            
        refreshBoard();
        return false;
    }

    // --- Execute the move ---
    const [endRow, endCol, altRow, altCol] = playableBoard.piece_end_location(selectedPiece, rolledValue);
    const validMoves = [];
    if (endRow !== -1 && endCol !== -1) validMoves.push([endRow, endCol]);
    if (altRow !== -1 && altCol !== -1) validMoves.push([altRow, altCol]);

    const isValid = validMoves.some(([r, c]) => r === row && c === col);
    if (isValid) {
        playableBoard.move_piece(selectedPiece, [row, col]);
        if (checkWin()) {
            selectedPiece = null;
            rolledValue = 0;
            updateSticks(0);
            clearHighlights();
            refreshBoard();
            return; // Para o jogo - não alterna turno
        }
        selectedPiece = null;
        refreshBoard();
        clearHighlights();
        updateSticks(0);
        document.getElementById("RollOutput").textContent = "";
        return true; // ✅ move completed successfully
    } else {
        selectedPiece = null;
        clearHighlights();
        refreshBoard();
        return false;
    }
}


function waitForPlayerMove() {
    return new Promise((resolve) => {
        function handleMove(e) {
            const moveDone = handlePlayerClick(e);
            if (moveDone) {
                board.removeEventListener("click", handleMove);
                resolve(); // resume game loop
            }
        }
        board.addEventListener("click", handleMove);
    });
}


// --- REFRESH BOARD ---
function refreshBoard() {
    const readable = playableBoard.readable_board();
    const squares = document.querySelectorAll(".square");

    squares.forEach((sq) => {
        const r = parseInt(sq.dataset.row);
        const c = parseInt(sq.dataset.col);
        sq.textContent = readable[r][c];
        sq.classList.remove("selected", "move", "capture");
    });
}


// --- TURN SYSTEM ---
function switchTurn() {
    currentPlayer = currentPlayer === "O" ? "X" : "O";
}

function updateTurnDisplay() {
    const turnDiv = document.getElementById("turnIndicator");
    if (turnDiv) {
        turnDiv.textContent = `Current Turn: ${currentPlayer}`;
    }
}


// --- ROLL BUTTON HANDLER ---

let dice_rolled = false

function roll() {       // Only returns Value
    rolledValue = rng();
    dice_rolled = true;
    console.log(`${currentPlayer} rolled:`, rolledValue);
    console.log(dice_rolled)
    updateSticks(rolledValue);

    // Show what the player rolled
    const rollDiv = document.getElementById("RollOutput");
    if (rollDiv) {
        rollDiv.textContent = `${currentPlayer} rolled ${rolledValue}`;
        updateTurnDisplay();
    }
}

function waitForRoll() {
    return new Promise(resolve => {
        const rollBtn = document.querySelector(".button");

        function onRollClick() {
            rollBtn.removeEventListener("click", onRollClick);
            resolve(rolledValue);
        }

        rollBtn.addEventListener("click", onRollClick);
    });
}


// === AI TURN LOGIC ===
async function aiTurn(rolledValue, AISymbol) {

    const root = new MiniMax(playableBoard, AISymbol);
    const [eval, newBoard] = root.minimaxRun(AISymbol, rolledValue, 1);

    console.table("AITURN", newBoard.readable_board());

    playableBoard = newBoard;  // replace with AI's final board
    refreshBoard();            // redraw UI
}


function drawBoard() {
    const board = document.getElementById("board");
    board.innerHTML = ""; // clear any old board

    const readable = playableBoard.readable_board();
    const rows = readable.length;
    const cols = readable[0].length;

    // grid dynamic size
    board.style.display = "grid";
    board.style.gridTemplateRows = `repeat(${rows}, 60px)`;
    board.style.gridTemplateColumns = `repeat(${cols}, 60px)`;

    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            const square = document.createElement("div");
            square.classList.add("square");

            // alternating pattern
            const isLight = (cols % 2 === 0)
                ? (row + col) % 2 === 0
                : (row + col) % 2 !== 0;

            square.classList.add(isLight ? "light" : "dark");
            square.dataset.row = row;
            square.dataset.col = col;
            square.textContent = readable[row][col];

            board.appendChild(square);
        }
    }
}

rolledValue = 0;


function waitForPass() {
    return new Promise((resolve) => {
        const passBtn = document.getElementById("passButton");

        function onPassClick() {
            passBtn.removeEventListener("click", onPassClick);
            resolve();
        }

        passBtn.addEventListener("click", onPassClick);
    });
}


async function gameLoop() {
    updateTurnDisplay();

    while (!playableBoard.is_game_won()) {
        console.log("Current Player:", currentPlayer);

        if (currentPlayer === playerSymbol) {
            // Wait until player rolls
            rolledValue = await waitForRoll();
            const possible_moves = playableBoard.get_possible_moves(playerSymbol, rolledValue);
            // If player has moves, wait for them to pick one
            if (possible_moves.length > 0) {
                await waitForPlayerMove();
            } else {
                console.log("No moves available, skipping turn.");
                await waitForPass();
                switchTurn();
                updateTurnDisplay();
            }
            
        } else {
            // 🧠 AI 
            await new Promise(resolve => setTimeout(resolve, 2000));        //time.sleep(10)
            console.log("AI MOVE");
            rolledValue = rng();
            console.log(rolledValue)
            drawBox();
            drawSticks(rolledValue);
            // Display "AI rolled x" instead of Arabic text
            const rollDiv = document.getElementById("RollOutput");
            if (rollDiv) {
                rollDiv.textContent = `AI rolled ${rolledValue}`;
            }
            await aiTurn(rolledValue, AISymbol); // make sure this awaits AI movement
        }

        // 🏁 Check for win
        if (playableBoard.is_game_won()) break;

        console.log("Rolled value:", rolledValue);

        // 🔁 Handle extra turn logic
        if ([1, 4, 6].includes(rolledValue)) {
            console.log(`${currentPlayer} gets an extra turn!`);
            continue; // stay on the same player
        } else {
            if (currentPlayer === playerSymbol) await waitForPass();
            switchTurn();
            console.log("Turn switched to", currentPlayer);
        }
    }

    alert(`${playableBoard.get_winner()} wins!`);
}








// --- INITIALIZE DISPLAY ---
let playableBoard = new Tab(7);
let playerSymbol = "X";  // Player Symbol
let currentPlayer = "X";  // Starting player
let AISymbol = playerSymbol === "X" ? "O" : "X";



drawBoard();
updateTurnDisplay();
gameLoop();



window.addEventListener('message', (e) => {
  if (e.data.type === 'START_GAME') {
    const cfg = e.data.config;

    // Recria tabuleiro
    playableBoard = new Tab(parseInt(cfg.size));
    generateBoardDOM(cfg.size);

    // Define quem começa
    starterRoller = cfg.firstPlayer;
    currentPlayer = cfg.firstPlayer;
    starterDecided = true;
    rolledValue = 1;

    // Atualiza UI
    refreshBoard();
    updateTurnDisplay();
    updateSticks(1);
    document.getElementById("RollOutput").textContent = "Tâb (primeira jogada)";
  }
});


// === VERIFICA VITÓRIA ===
function checkWin() {
  let oCount = 0;
  let xCount = 0;
  
  // Conta TODAS as peças no tabuleiro
  for (let r = 0; r < playableBoard.rows; r++) {
    for (let c = 0; c < playableBoard.cols; c++) {
      const cell = playableBoard.board[r][c];
      if (cell instanceof Piece) {
        if (cell.symbol === "O") oCount++;
        if (cell.symbol === "X") xCount++;
      }
    }
  }

  // Se um jogador perdeu todas as peças
  if (oCount === 0 || xCount === 0) {
    const winner = oCount === 0 ? "X" : "O";
    setTimeout(() => {
      alert(`${winner} venceu o jogo!`);
      window.parent.postMessage({ type: 'GAME_OVER', winner }, '*');
    }, 300);
    return true;
  }
  return false;
}

// === CHAMA checkWin APÓS CADA MOVIMENTO ===
const originalRefreshBoard = refreshBoard;
refreshBoard = function() {
  originalRefreshBoard();
  checkWin();
};

// === INICIALIZAÇÃO ===
generateBoardDOM(playableBoard.cols);
refreshBoard();
updateTurnDisplay();
updateSticks(0);













/*
// === TEST AI MOVE ===
// (Make sure MiniMax and Tab are defined above this)
function testAI() {
    console.log("=== Testing MiniMax AI ===");
    const testBoard = new Tab(4); // smaller board for clarity

    console.table(testBoard.readable_board());
    const ai = new MiniMax(testBoard, true);

    // try a shallow search (depth 2)
    try {
        const result = ai.minimaxRun(AISymbol, 1, 1); // symbol "X", roll value 2, depth 2
        console.log("AI result:", result);
        console.table(result[1].readable_board());

        if (result.move) {
            const [start, end] = result.move;
            console.log("AI decided to move from", start, "to", end);
            testBoard.move_piece(start, end);
        } else {
            console.log("AI found no valid moves.");
        }
    } catch (err) {
        console.error("MiniMax error:", err);
    }


}

// call it after everything else is initialized
testAI();
*/