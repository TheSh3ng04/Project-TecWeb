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
        this.X_row_empty = false;
        this.O_row_empty = false;
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
        const isTopRow = p_row === 0;
        const isBottomRow = p_row === this.rows - 1;
        if (!isTopRow && !isBottomRow) return;

        const targetSymbol = isTopRow ? 'O' : 'X';
        const row = this.board[p_row];
        const hasOwnPiece = row.some(cell => cell instanceof Piece && cell.symbol === targetSymbol);

        if (isTopRow) this.O_row_empty = !hasOwnPiece;
        if (isBottomRow) this.X_row_empty = !hasOwnPiece;
    }
    //selected_piece is a set of coordenates,
    get_piece_movement_horizontal_direction(p_row) {
        return (p_row % 2 === 0) ? -1 : 1;
    }

    
    get_piece_movement_vertical_direction(selected_piece, p_end_col) {
        const [p_row, p_col] = selected_piece
        const piece = this.board[p_row][p_col]
        let direction = 0
        let canUp = false
        let canDown = false

        // refresh back-row state
        this.is_back_row_clear(0)
        this.is_back_row_clear(this.rows - 1)

        const atLeft = p_end_col === 0
        const atRight = p_end_col === this.cols - 1
        const isO = piece.symbol === 'O'
        const atTop = p_row === 0
        const atBottom = p_row === this.rows - 1

        if (atLeft) {
            if (atTop) canDown = true
            if (p_row === 2) {
                if (isO) {
                    const bothOpen = this.X_row_empty && !piece.entered_opponent_row
                    canUp = true
                    if (bothOpen) canDown = true
                } else {
                    canUp = true
                }
            }
        }

        if (atRight) {
            if (atBottom) canUp = true
            if (p_row === 1) {
                if (!isO) {
                    const bothOpen = this.O_row_empty && !piece.entered_opponent_row
                    canDown = true
                    if (bothOpen) canUp = true
                } else {
                    canDown = true
                }
            }
        }

        if (canUp && canDown) return 0
        if (canUp) return -1
        if (canDown) return 1

        return direction
    }
 
    // checks if path is blocked given starting location and ending location column
    is_path_blocked(selected_piece, piece_end_col) {
        const [p_row, p_col] = selected_piece;
        if (p_row === -1 || p_col === -1) return true;
    
        const h_direction = this.get_piece_movement_horizontal_direction(p_row);
        const remaining_moves = this.get_piece_remaining_move(selected_piece, piece_end_col);
        const piece = this.board[p_row][p_col];
        const range = Math.abs(p_col - piece_end_col);
    
        for (let i = 1; i <= range; i++) {
            const next_col = p_col + i * h_direction;
            if (next_col < 0 || next_col >= this.cols) break;
    
            const cell = this.board[p_row][next_col];
    
            if (i < range) {
                if (cell instanceof Piece && cell.symbol !== piece.symbol) return true; // cannot jump
            } else {
                if (cell === ' ') return false; // empty landing
                if (cell instanceof Piece && cell.symbol === piece.symbol) return remaining_moves <= 0; // blocked only if no vertical moves left
                if (cell instanceof Piece && cell.symbol !== piece.symbol) return false; // capture allowed ← THIS LINE WAS MISSING
            }
        }
        return false;
    }
    
    // calculates if piece gets out of bounds
    is_piece_OFB(selected_piece, value){
        const [p_row, p_col] = selected_piece;
        const h_direction = this.get_piece_movement_horizontal_direction(p_row);
        const final_col = p_col + value * h_direction;
        return final_col < 0 || final_col >= this.cols 
    }

    // calculates remaining moves after a piece hits a border
    get_piece_remaining_move(selected_piece, value) {
        if (!this.is_piece_OFB(selected_piece, value)) return 0;
        const [p_row, p_col] = selected_piece;
        const h_direction = this.get_piece_movement_horizontal_direction(p_row);
        const distance_to_border = h_direction === 1 ? (this.cols - 1 - p_col) : p_col;
        return value - distance_to_border;
    }

    // calculates the ending location of piece col
    get_piece_end_col(selected_piece, value) {
        const [p_row, p_col] = selected_piece;
        if (value === 0) return p_col;
        const h_direction = this.get_piece_movement_horizontal_direction(p_row);
        let end_location = p_col + (h_direction * value);
        if (this.is_piece_OFB(selected_piece, value)) end_location = h_direction === 1 ? this.cols - 1 : 0;
        return this.is_path_blocked(selected_piece, end_location) ? -1 : end_location;
    }

    // Check if horizontal path to border is clear (no opponent pieces blocking)
    is_horizontal_path_clear_to_border(selected_piece, border_col) {
        const [p_row, p_col] = selected_piece;
        const piece = this.board[p_row][p_col];
        const h_dir = this.get_piece_movement_horizontal_direction(p_row);
        const range = Math.abs(p_col - border_col);
        
        // Check all cells in the path (including the border)
        for (let i = 1; i <= range; i++) {
            const next_col = p_col + i * h_dir;
            if (next_col < 0 || next_col >= this.cols) break;
            
            const cell = this.board[p_row][next_col];
            // If there's an opponent piece anywhere in the path, the path is blocked
            if (cell instanceof Piece && cell.symbol !== piece.symbol) {
                return false;
            }
        }
        return true;
    }

    piece_lane_switch(selected_piece, value) {      // returns row, alt row, end col, remaining moves, 
        const [p_row, p_col] = selected_piece;
        if (!this.is_piece_OFB(selected_piece, value)) return [-1, -1, -1, -1];

        const piece = this.board[p_row][p_col];
        const remaining_moves = this.get_piece_remaining_move(selected_piece, value);
        const h_dir = this.get_piece_movement_horizontal_direction(p_row);
        const end_col = (h_dir === 1) ? this.cols - 1 : 0; // actual border column
        
        // Check if horizontal path to border is clear - if blocked by opponent, can't move vertically
        if (!this.is_horizontal_path_clear_to_border(selected_piece, end_col)) {
            return [-1, -1, -1, -1];
        }
        
        const direction = this.get_piece_movement_vertical_direction(selected_piece, end_col);

        if (direction !== 0) {
            const new_row = p_row + direction;
            if (new_row < 0 || new_row >= this.rows) return [-1, -1, -1, -1];
            const target = this.board[new_row][end_col];
            const canMove =
                target === " " ||
                (target instanceof Piece && target.symbol !== piece.symbol && remaining_moves === 1) ||
                (target instanceof Piece && target.symbol === piece.symbol && remaining_moves >= 2);
            return canMove ? [new_row, -1, end_col, remaining_moves - 1] : [-1, -1, -1, -1];
        }

        // If direction is 0, both vertical options possible
        const up = (p_row - 1 >= 0) ? p_row - 1 : -1;
        const down = (p_row + 1 < this.rows) ? p_row + 1 : -1;        
        return [down, up, end_col, remaining_moves - 1];
    }
    
    
    piece_end_location(selected_piece, value) { // returns row, col, alt row, alt col
        if (this.is_piece_OFB(selected_piece, value)) {
            const [p_new_row, p_new_row_alt, p_new_col, remaining_moves] = this.piece_lane_switch(selected_piece, value);
            if (p_new_row === -1 && p_new_row_alt === -1) return [-1, -1, -1, -1];
            const final_col = this.get_piece_end_col([p_new_row, p_new_col], remaining_moves);
            if (p_new_row_alt !== -1) {
                const final_col_alt = this.get_piece_end_col([p_new_row_alt, p_new_col], remaining_moves);
                return [p_new_row, final_col, p_new_row_alt, final_col_alt]
            }
            return [p_new_row, final_col, -1, -1]
        }
        const final_col = this.get_piece_end_col(selected_piece, value);
        const [p_row] = selected_piece;
        return [p_row, final_col, -1, -1];
    }   
    
    is_move_legal(selected_piece, value) {
        const [original_p_row, original_p_col] = selected_piece;
        const piece = this.board[original_p_row][original_p_col]
        if (!piece.hasMoved && value !== 1) return false;
        const [p_row, p_col, p_row_alt, p_col_alt] = this.piece_end_location(selected_piece, value)
        if (p_row < 0 && p_col < 0 && p_row_alt < 0 && p_col_alt < 0) return false;
        return (p_row >= 0 && p_col >= 0) || (p_row_alt >= 0 && p_col_alt >= 0);
    }

    get_possible_moves(symbol, value) {
        const possibleMoves = [];
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                const cell = this.board[row][col];
                if (cell instanceof Piece && cell.symbol === symbol) {
                    if (this.is_move_legal([row, col], value)) {
                        const [end_row, end_col, alt_row, alt_col] = this.piece_end_location([row, col], value);
                        
                        // Only add primary move if valid AND not blocked by ally
                        if (end_row >= 0 && end_col >= 0) {
                            const target = this.board[end_row][end_col];
                            if (!(target instanceof Piece && target.symbol === symbol)) {
                                possibleMoves.push([[row, col], [end_row, end_col]]);
                            }
                        }
                        
                        // Only add alt move if valid AND not blocked by ally
                        if (alt_row >= 0 && alt_col >= 0) {
                            const target_alt = this.board[alt_row][alt_col];
                            if (!(target_alt instanceof Piece && target_alt.symbol === symbol)) {
                                possibleMoves.push([[row, col], [alt_row, alt_col]]);
                            }
                        }
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
    
        // Capture opponent piece
        if (target instanceof Piece && target.symbol !== piece.symbol) {
            this.board[new_p_row][new_p_col] = " ";
            if (target.symbol === "X") {
                this.x_piece_count--;
            } else if (target.symbol === "O") {
                this.o_piece_count--;
            }
        }
        // If ally piece is there, this shouldn't happen - but if it does, don't overwrite
        else if (target instanceof Piece && target.symbol === piece.symbol) {
            console.error("Trying to move to square occupied by ally piece!", selected_piece, end_location);
            return; // Don't make the move
        }
    
        // Move the piece
        this.board[p_row][p_col] = " ";
        this.board[new_p_row][new_p_col] = piece;
    
        // Update piece state
        piece.hasMoved = true;
        if (piece.symbol === "O" && new_p_row === this.rows - 1) piece.entered_opponent_row = true;
        if (piece.symbol === "X" && new_p_row === 0) piece.entered_opponent_row = true;
    
        this.last_piece_moved = [p_row, p_col, new_p_row, new_p_col];
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





class AI {
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

    // Evaluate an arbitrary board without mutating this instance
    evaluate_on(board, maximizingPlayer) {
        const original = this.board;
        this.board = board;
        const score = this.evaluate(maximizingPlayer);
        this.board = original;
        return score;
    }

    // Depth-1 greedy selection using the evaluate function
    pick_best_move(maximizingSymbol, value) {
        const possibleMoves = this.board.get_possible_moves(maximizingSymbol, value);
        console.log(`AI rolled ${rolledValue}, possible moves:`, possibleMoves);
        let bestEval = -Infinity;
        let bestBoard = this.board;
        for (let move of possibleMoves) {
            const [start_row, start_col] = move[0];
            const [end_row, end_col] = move[1];
            const newBoard = this.board.copy_board();
            newBoard.move_piece([start_row, start_col], [end_row, end_col]);
            const evalScore = this.evaluate_on(newBoard, maximizingSymbol);
            if (evalScore > bestEval) {
                bestEval = evalScore;
                bestBoard = newBoard;
            }
            console.log(evalScore)
        }
        return [bestEval, bestBoard];
    }
    

    Run(maximizingSymbol, value) {
        // One-ply (depth-1) evaluation: choose move that maximizes immediate eval
        return this.pick_best_move(maximizingSymbol, value);
    }
}



//Event listener, click logic

// === CLICK + MOVEMENT LOGIC ===

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

let rolledValue = 0;
let selectedPiece = null;
let playerListenerAttached = false;
const boardEl = document.getElementById("board");

function enablePlayerInput() {
    if (!playerListenerAttached && boardEl) {
        boardEl.addEventListener("click", handlePlayerClick);
        playerListenerAttached = true;
    }
}

function disablePlayerInput() {
    if (playerListenerAttached && boardEl) {
        boardEl.removeEventListener("click", handlePlayerClick);
        playerListenerAttached = false;
    }
}

// --- CLICK HANDLER ---
function handlePlayerClick(e) {
    const square = e.target;
    if (!square.classList.contains("square")) return false;

    const row = parseInt(square.dataset.row);
    const col = parseInt(square.dataset.col);
    const cell = playableBoard.board[row][col];

    // Prevent selecting opponent pieces when no piece is selected
    if (!selectedPiece) {
        // Must roll first before any selection
        if (!Number.isInteger(rolledValue) || rolledValue === 0) {
            alert("You must roll first!");
            return false;
        }
        
        // Block clicking on opponent pieces for selection
        if (cell instanceof Piece && cell.symbol !== currentPlayer) {
            return false; // Silently ignore opponent piece clicks
        }
        
        // Selecting a piece
        if (!(cell instanceof Piece)) return false;
        selectedPiece = [row, col];
        highlightDestinations(selectedPiece, rolledValue);
        return false;
    }

    // A piece is already selected - handle clicks on board squares
    // If clicking on another of current player's pieces, reselect
    if (cell instanceof Piece && cell.symbol === currentPlayer) {
        selectedPiece = [row, col];
        clearHighlights();
        highlightDestinations(selectedPiece, rolledValue);
        return false;
    }

    // --- Check if move is legal for the selected piece ---
    if (!playableBoard.is_move_legal(selectedPiece, rolledValue)) {
        alert("This piece cannot move with this roll!");
        selectedPiece = null;
        clearHighlights();            
        refreshBoard();
        return false;
    }

    // --- Get valid move destinations ---
    const [endRow, endCol, altRow, altCol] = playableBoard.piece_end_location(selectedPiece, rolledValue);
    const validMoves = [];
    if (endRow !== -1 && endCol !== -1) validMoves.push([endRow, endCol]);
    if (altRow !== -1 && altCol !== -1) validMoves.push([altRow, altCol]);

    // Prevent clicking on opponent pieces that are not valid capture destinations
    if (cell instanceof Piece && cell.symbol !== currentPlayer) {
        const isValidDestination = validMoves.some(([r, c]) => r === row && c === col);
        if (!isValidDestination) {
            return false; // Not a valid capture destination, ignore click
        }
    }

    // --- Check if clicked destination matches one of valid end locations ---
    const isValid = validMoves.some(([r, c]) => r === row && c === col);
    if (!isValid) {
        // invalid destination click: keep selection so user can click a valid one
        return false;
    }

    playableBoard.move_piece(selectedPiece, [row, col]);
    selectedPiece = null;
    refreshBoard();
    clearHighlights();
    updateSticks(0);
    document.getElementById("RollOutput").textContent = "";
    return true; // ✅ move completed successfully
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

// -- Sticks draw and rolls -- //

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
        return "Tâb" 
    } else if (value == 2) {
        return "Itneyn"
    } else if (value == 3) {
        return "Teláteh" 
    } else if (value == 4) {
        return "Arba'ah" 
    } else if (value == 6) {
        return "Sitteh"
    }
}


// --- ROLL BUTTON HANDLER ---
function roll() {
    rolledValue = rng();
    console.log(`${currentPlayer} rolled:`, rolledValue);
    updateSticks(rolledValue);

    // Show what the player rolled
    const rollDiv = document.getElementById("RollOutput");
    if (rollDiv) {
        rollDiv.textContent = `${currentPlayer} rolled ${rolledValue}`;
        updateTurnDisplay();
    }
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

//Pass turn
function passTurn() {
    switchTurn();
    updateTurnDisplay();
    updateSticks(0);
    rolledValue = 0;
    console.log("Turn passed")
}

function waitForPass() {
    return new Promise(resolve => {
        const rollBtn = document.querySelector(".Passing-Turn");

        function onPassClick() {
            rollBtn.removeEventListener("click", onPassClick);
            resolve(rolledValue);
        }

        rollBtn.addEventListener("click", onPassClick);
    });
}


// -- main loop -- //
async function gameloop() {
// ROll -> Move -> Next 
// Roll -> MOVE -> MOVE -> NEXT 
    while (!playableBoard.is_game_won()) {
        if (currentPlayer === playerSymbol) {
            await waitForPass()
        } else {
            roll();
            await new Promise(resolve => setTimeout(resolve, 2000));        //time.sleep(10)
            const root = new AI(playableBoard, AISymbol);
            const [eval, newBoard] = root.Run(AISymbol, rolledValue);
            playableBoard = newBoard;  // replace with AI's final board
            refreshBoard();            // redraw U     

            if (playableBoard.is_game_won()) break;

            if ([1, 4, 6].includes(rolledValue)) {
                console.log(`${currentPlayer} gets an extra turn!`);
                continue; // stay on the same player
            } else {
                passTurn()
                console.log("Turn switched to", currentPlayer);
            }

        }
        
    }
    alert(`${playableBoard.get_winner()} wins!`);
}


let playableBoard = new Tab(7);
let currentPlayer = "X";
const playerSymbol = "X";
const AISymbol = "O";

updateSticks(0);
updateTurnDisplay();
drawBoard();
enablePlayerInput();
gameloop();


