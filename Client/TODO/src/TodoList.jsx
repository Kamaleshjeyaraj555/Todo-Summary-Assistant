import React, { useState, useEffect } from 'react'

const API_BASE = 'http://localhost:8080/api/todos';

const TodoList = () => {
    const [tasks, setTasks] = useState([]);
    const [deletedTasks, setDeletedTasks] = useState([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [newTitle, setNewTitle] = useState("");
    const [newDescription, setNewDescription] = useState("");
    const [editIndex, setEditIndex] = useState(null);
    const [editValue, setEditValue] = useState("");
    const [editDescValue, setEditDescValue] = useState("");
    const [slackStatus, setSlackStatus] = useState(null);
    const [showCompletedDropdown, setShowCompletedDropdown] = useState(false);
    const [search, setSearch] = useState("");
    const [showCompletedPage, setShowCompletedPage] = useState(false);
    const [completedEditIndex, setCompletedEditIndex] = useState(null);
    const [completedEditValue, setCompletedEditValue] = useState("");
    const [completedEditDescValue, setCompletedEditDescValue] = useState("");

    
    const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
    const SLACK_WEBHOOK_URL = import.meta.env.VITE_SLACK_WEBHOOK_URL;

 
    const username = localStorage.getItem('username') || 'demo';

    
    useEffect(() => {
        fetch(`${API_BASE}/${username}`)
            .then(res => res.json())
            .then(data => setTasks(data))
            .catch(() => setTasks([]));
    }, [username]);

    function openAddModal() {
        setShowAddModal(true);
        setNewTitle("");
        setNewDescription("");
    }
    function closeAddModal() {
        setShowAddModal(false);
        setNewTitle("");
        setNewDescription("");
    }
  
    function handleAddTask() {
        if (newTitle.trim() === "") return;
        fetch(API_BASE, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title: newTitle,
                description: newDescription,
                completed: false,
                username: username 
            })
        })
        .then(res => {
            if (!res.ok) throw new Error('Failed to add task');
            return res.json();
        })
        .then(newTask => {
            setTasks([...tasks, newTask]);
            closeAddModal();
        })
        .catch(err => {
            setSlackStatus('Error adding task: ' + (err.message || err.toString()));
        });
    }
  
    function deleteTask(index) {
        const task = tasks[index];
        fetch(`${API_BASE}/${task.id}`, { method: 'DELETE' })
            .then(() => {
                setDeletedTasks([{ ...task, deletedAt: new Date().toISOString() }, ...deletedTasks]);
                setTasks(tasks.filter((_, i) => i !== index));
            });
    }
    function moveTaskUp(index) {
        if (index === 0) return;
        const newTasks = [...tasks];
        [newTasks[index - 1], newTasks[index]] = [newTasks[index], newTasks[index - 1]];
        setTasks(newTasks);
    }
    function moveTaskDown(index) {
        if (index === tasks.length - 1) return;
        const newTasks = [...tasks];
        [newTasks[index + 1], newTasks[index]] = [newTasks[index], newTasks[index + 1]];
        setTasks(newTasks);
    }
    function startEdit(index) {
        setEditIndex(index);
        setEditValue(tasks[index].title);
        setEditDescValue(tasks[index].description || "");
    }
    function handleEditChange(e) {
        setEditValue(e.target.value);
    }
    function handleEditDescChange(e) {
        setEditDescValue(e.target.value);
    }
    
    function saveEdit(index) {
        if (editValue.trim() === "") return;
        const task = tasks[index];
        fetch(`${API_BASE}/${task.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ...task,
                title: editValue,
                description: editDescValue
            })
        })
        .then(res => res.json())
        .then(updatedTask => {
            const newTasks = [...tasks];
            newTasks[index] = updatedTask;
            setTasks(newTasks);
            setEditIndex(null);
            setEditValue("");
            setEditDescValue("");
        });
    }
    function cancelEdit() {
        setEditIndex(null);
        setEditValue("");
        setEditDescValue("");
    }
  
    function toggleComplete(index) {
        const task = tasks[index];
        fetch(`${API_BASE}/${task.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...task, completed: !task.completed })
        })
        .then(res => res.json())
        .then(updatedTask => {
            const newTasks = [...tasks];
            newTasks[index] = updatedTask;
            setTasks(newTasks);
        });
    }

    async function generateSummaryWithLLM(tasks) {
        if (!OPENAI_API_KEY) throw new Error('OpenAI API key not set');
        const endpoint = 'https://api.openai.com/v1/chat/completions';
        const prompt = `Summarize the following to-do list in a concise, helpful way:\n${tasks.map(t => `- ${t.title}${t.completed ? ' (completed)' : ''}`).join('\n')}`;
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: 'gpt-3.5-turbo',
                messages: [{ role: 'user', content: prompt }],
                max_tokens: 100
            })
        });
        const data = await response.json();
        console.log('OpenAI API response:', data); 
        if (data.error) throw new Error('OpenAI error: ' + (data.error.message || JSON.stringify(data.error)));
        if (!data.choices || !data.choices[0]?.message?.content) throw new Error('No summary generated. Full response: ' + JSON.stringify(data));
        return data.choices[0].message.content;
    }

    async function sendSummaryToSlack(summary) {
        if (!SLACK_WEBHOOK_URL) throw new Error('Slack webhook URL not set');
        const payload = { text: summary };
        const response = await fetch(SLACK_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        return response.ok;
    }
    
    async function generateAndSendSummary() {
        setSlackStatus('Generating summary...');
        try {
            const response = await fetch(`http://localhost:8080/api/todos/summarize/${username}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            let data;
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                data = await response.json();
            } else {
                data = await response.text();
            }
            if (response.ok) {
                setSlackStatus('Summary sent to Slack!');
            } else {
                setSlackStatus('Error: ' + (data?.message || data || 'Unknown error'));
            }
        } catch (err) {
            setSlackStatus('Error: ' + (err?.message || err?.toString() || 'Unknown error'));
            console.error('Summary/Slack error:', err);
        }
    }
    function openCompletedPage() {
        setShowCompletedPage(true);
    }
    function closeCompletedPage() {
        setShowCompletedPage(false);
        setCompletedEditIndex(null);
        setCompletedEditValue("");
        setCompletedEditDescValue("");
    }
    function startCompletedEdit(index) {
        setCompletedEditIndex(index);
        setCompletedEditValue(completedTasks[index].title);
        setCompletedEditDescValue(completedTasks[index].description || "");
    }
 
    function saveCompletedEdit(index) {
        if (completedEditValue.trim() === "") return;
        const realIndex = tasks.findIndex((t, i) => t.completed && t.title === completedTasks[index].title && t.createdAt === completedTasks[index].createdAt);
        if (realIndex !== -1) {
            const task = tasks[realIndex];
            fetch(`${API_BASE}/${task.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...task,
                    title: completedEditValue,
                    description: completedEditDescValue
                })
            })
            .then(res => res.json())
            .then(updatedTask => {
                const newTasks = [...tasks];
                newTasks[realIndex] = updatedTask;
                setTasks(newTasks);
                setCompletedEditIndex(null);
                setCompletedEditValue("");
                setCompletedEditDescValue("");
            });
        }
    }
   
    function deleteCompletedTask(index) {
        const realIndex = tasks.findIndex((t, i) => t.completed && t.title === completedTasks[index].title && t.createdAt === completedTasks[index].createdAt);
        if (realIndex !== -1) {
            const task = tasks[realIndex];
            fetch(`${API_BASE}/${task.id}`, { method: 'DELETE' })
                .then(() => {
                    setDeletedTasks([{ ...task, deletedAt: new Date().toISOString() }, ...deletedTasks]);
                    setTasks(tasks.filter((_, i) => i !== realIndex));
                });
        }
    }


    const completedTasks = tasks.filter(t => t.completed);
    const incompleteTasks = tasks.filter(t => !t.completed && t.title.toLowerCase().includes(search.toLowerCase()));

    return (
        <div className='to-do-list' style={{ minHeight: '100vh', width: '100vw', maxWidth: '100%', margin: 0, padding: 0, background: '#fff', boxSizing: 'border-box' }}>
            <h1>To-Do-List</h1>
            <div className="task-bar">
                <span style={{ color: '#222', fontWeight: 600, fontSize: 23, marginRight: 16 }}>Your Tasks</span>
                <input
                    type="text"
                    placeholder="Search Tasks Here..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
                <div style={{ position: 'relative', display: 'inline-block' }}>
                    <button
                        className='completed-dropdown-btn'
                        onClick={() => setShowCompletedDropdown(v => !v)}
                        style={{ background: 'none', color: 'inherit', border: '1px solid #cbd5e1', borderRadius: 5, padding: '0.2rem 0.7rem', fontSize: 13, marginLeft: 8, display: 'flex', alignItems: 'center', cursor: 'pointer', height: 32 }}
                    >
                        Tasks ▼
                    </button>
                    {showCompletedDropdown && (
                        <div className='completed-dropdown-list' style={{ position: 'absolute', top: '110%', left: 0, background: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.07)', borderRadius: 6, minWidth: 320, zIndex: 10, maxHeight: 400, overflowY: 'auto', padding: '0.5rem 0' }}>
                            <div style={{ padding: '0.5rem 1rem', borderBottom: '1px solid #eee', fontWeight: 600 }}>Completed ({completedTasks.length})</div>
                            <div style={{ margin: 0, padding: '0.5rem 1rem' }}>
                                {completedTasks.length === 0 && <div style={{ color: '#888' }}>No completed tasks</div>}
                                {completedTasks.map((task, idx) => {
                                    const realIndex = tasks.findIndex((t, i) => t.title === task.title && t.completed && t.createdAt === task.createdAt);
                                    return (
                                        <div key={realIndex} style={{ border: '1px solid #cbd5e1', borderRadius: 8, background: '#f1f5f9', marginBottom: 12, padding: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                                            {editIndex === realIndex ? (
                                                <>
                                                    <input value={editValue} onChange={handleEditChange} style={{ width: '100%', marginBottom: 6 }} />
                                                    <input value={editDescValue} onChange={handleEditDescChange} style={{ width: '100%', marginBottom: 6 }} />
                                                    <button onClick={() => saveEdit(realIndex)} style={{ marginRight: 6 }}>Save</button>
                                                    <button onClick={cancelEdit}>Cancel</button>
                                                </>
                                            ) : (
                                                <>
                                                    <div style={{ fontWeight: 600, fontSize: 16 }}>{task.title}</div>
                                                    <div style={{ color: '#555', marginBottom: 4 }}>{task.description}</div>
                                                    <div style={{ fontSize: 12, color: '#888' }}>Created: {task.createdAt ? new Date(task.createdAt).toLocaleString() : '-'}</div>
                                                    <button className='edit-button' onClick={() => startEdit(realIndex)} style={{ marginRight: 6, background: 'none', border: 'none', boxShadow: 'none', padding: 0, cursor: 'pointer' }} title="Edit">
                                                        <span role="img" aria-label="edit">✏️</span>
                                                    </button>
                                                    <button className='delete-button' onClick={() => deleteTask(realIndex)} style={{ background: 'none', border: 'none', boxShadow: 'none', padding: 0, cursor: 'pointer' }} title="Delete">
                                                        <span role="img" aria-label="delete">🗑️</span>
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                            <div style={{ padding: '0.5rem 1rem', borderTop: '1px solid #eee', fontWeight: 600 }}>Not Completed ({incompleteTasks.length})</div>
                            <ol style={{ margin: 0, padding: '0.5rem 1rem' }}>
                                {incompleteTasks.length === 0 && <li style={{ color: '#888' }}>No incomplete tasks</li>}
                                {incompleteTasks.map((task, index) => (
                                    <li key={index} style={{ color: '#222', background: 'none', padding: 0, margin: 0 }}>{task.title}</li>
                                ))}
                            </ol>
                            <div style={{ padding: '0.5rem 1rem', borderTop: '1px solid #eee', fontWeight: 600 }}>Deleted ({deletedTasks.length})</div>
                            <div style={{ margin: 0, padding: '0.5rem 1rem' }}>
                                {deletedTasks.length === 0 && <div style={{ color: '#888' }}>No deleted tasks</div>}
                                {deletedTasks.map((task, idx) => (
                                    <div key={idx} style={{ border: '1px solid #f87171', borderRadius: 8, background: '#fef2f2', marginBottom: 12, padding: 12 }}>
                                        <div style={{ fontWeight: 600, fontSize: 16 }}>{task.title}</div>
                                        <div style={{ color: '#555', marginBottom: 4 }}>{task.description}</div>
                                        <div style={{ fontSize: 12, color: '#888' }}>Created: {task.createdAt ? new Date(task.createdAt).toLocaleString() : '-'}</div>
                                        <div style={{ fontSize: 12, color: '#e11d48' }}>Deleted: {task.deletedAt ? new Date(task.deletedAt).toLocaleString() : '-'}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
                <button className='add-button' onClick={openAddModal} style={{marginLeft: 8}}>Add New</button>
            </div>
            {/* Add Task Modal */}
            {showAddModal && (
                <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.15)', zIndex: 1000, display: 'flex', alignItems: 'flex-start', justifyContent: 'center' }}>
                  <div className="modal" style={{ width: '100vw', height: '100vh', minWidth: 0, minHeight: 0, borderRadius: 0, boxShadow: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff', padding: 0 }}>
                    <div className="modal-content" style={{ width: '100%', maxWidth: 600, margin: 'auto', background: '#fff', borderRadius: 10, boxShadow: '0 2px 16px rgba(0,0,0,0.13)', padding: '2rem 2rem 1rem 2rem' }}>
                      <div className="modal-row">
                        <label style={{ flex: 1, fontWeight: 500 }}>Title</label>
                        <input style={{ flex: 2 }} type="text" value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Task title" />
                      </div>
                      <div className="modal-row">
                        <label style={{ flex: 1, fontWeight: 500 }}>Description</label>
                        <input style={{ flex: 2 }} type="text" value={newDescription} onChange={e => setNewDescription(e.target.value)} placeholder="Task description" />
                      </div>
                      <div className="modal-actions">
                        <button style={{ background: '#fff', color: '#222', border: '1px solid #cbd5e1', marginRight: 8 }} onClick={closeAddModal}>Cancel</button>
                        <button style={{ background: '#2563eb', color: '#fff' }} onClick={handleAddTask}>OK</button>
                      </div>
                    </div>
                  </div>
                  <div className="modal-backdrop" onClick={closeAddModal}></div>
                </div>
            )}
            <ol style={{ maxHeight: '300px', overflowY: 'auto' }}>
                {incompleteTasks.map((task, index) => {
                   
                    const realIndex = tasks.findIndex((t, i) => t.title === task.title && t.completed === task.completed && !t.completed);
                    return (
                        <li key={realIndex}>
                            {editIndex === realIndex ? (
                                <>
                                    <input value={editValue} onChange={handleEditChange} />
                                    <button onClick={() => saveEdit(realIndex)}>Save</button>
                                    <button onClick={cancelEdit}>Cancel</button>
                                </>
                            ) : (
                                <>
                                    <span className='text'>{task.title}</span>
                                    <span style={{ marginLeft: 8, color: '#888', fontSize: 13 }}>{task.description}</span>
                                    <button
                                        style={{ background: task.completed ? '#22c55e' : '#ef4444', color: '#fff', marginLeft: '0.5rem' }}
                                        onClick={() => task.completed ? openCompletedPage() : toggleComplete(realIndex)}
                                        type="button"
                                    >
                                        {task.completed ? 'Completed' : 'Incomplete'}
                                    </button>
                                    <button className='edit-button' onClick={() => startEdit(realIndex)} title="Edit" style={{ marginLeft: 6, background: 'none', border: 'none', boxShadow: 'none', padding: 0, cursor: 'pointer' }}>
                                        <span role="img" aria-label="edit">✏️</span>
                                    </button>
                                    <button className='delete-button' onClick={() => deleteTask(realIndex)} title="Delete" style={{ marginLeft: 2, background: 'none', border: 'none', boxShadow: 'none', padding: 0, cursor: 'pointer' }}>
                                        <span role="img" aria-label="delete">🗑️</span>
                                    </button>
                                </>
                            )}
                        </li>
                    );
                })}
            </ol>
            <button className='summary-button' onClick={generateAndSendSummary}>Generate & Send Summary</button>
            {slackStatus && <div className='slack-status'>{slackStatus}</div>}
            {showCompletedPage && (
    <div className="completed-page-overlay" style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.15)', zIndex: 2000, display: 'flex', alignItems: 'flex-start', justifyContent: 'center' }}>
        <div className="completed-page" style={{ width: '100vw', height: '100vh', minWidth: 0, minHeight: 0, borderRadius: 0, boxShadow: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff', padding: 0 }}>
            <div style={{ width: '100%', maxWidth: 700, margin: 'auto', background: '#fff', borderRadius: 10, boxShadow: '0 2px 16px rgba(0,0,0,0.13)', padding: '2rem 2rem 1rem 2rem', overflowY: 'auto', maxHeight: '90vh' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                    <h2>Completed Tasks</h2>
                    <button onClick={closeCompletedPage} style={{ background: '#fff', color: '#222', border: '1px solid #cbd5e1', borderRadius: 6, padding: '0.3rem 1rem', fontWeight: 600 }} type="button">Close</button>
                </div>
                {completedTasks.length === 0 && <div style={{ color: '#888' }}>No completed tasks</div>}
                {completedTasks.map((task, idx) => (
                    <div key={idx} style={{ border: '1px solid #cbd5e1', borderRadius: 8, background: '#f1f5f9', marginBottom: 18, padding: 18, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                        {completedEditIndex === idx ? (
                            <>
                                <input value={completedEditValue} onChange={e => setCompletedEditValue(e.target.value)} style={{ width: '100%', marginBottom: 6 }} />
                                <input value={completedEditDescValue} onChange={e => setCompletedEditDescValue(e.target.value)} style={{ width: '100%', marginBottom: 6 }} />
                                <button onClick={() => saveCompletedEdit(idx)} style={{ marginRight: 6 }} type="button">Save</button>
                                <button onClick={() => setCompletedEditIndex(null)} type="button">Cancel</button>
                            </>
                        ) : (
                            <>
                                <div style={{ fontWeight: 600, fontSize: 18 }}>{task.title}</div>
                                <div style={{ color: '#555', marginBottom: 4 }}>{task.description}</div>
                                <div style={{ fontSize: 13, color: '#888' }}>Created: {task.createdAt ? new Date(task.createdAt).toLocaleString() : '-'}</div>
                                {task.deletedAt && <div style={{ fontSize: 13, color: '#e11d48' }}>Deleted: {new Date(task.deletedAt).toLocaleString()}</div>}
                                <button className='edit-button' onClick={() => startCompletedEdit(idx)} style={{ marginRight: 6, marginTop: 10, background: 'none', border: 'none', boxShadow: 'none', padding: 0, cursor: 'pointer' }} type="button" title="Edit">
                                    <span role="img" aria-label="edit">✏️</span>
                                </button>
                                <button className='delete-button' onClick={() => deleteCompletedTask(idx)} style={{ marginTop: 10, background: 'none', border: 'none', boxShadow: 'none', padding: 0, cursor: 'pointer' }} type="button" title="Delete">
                                    <span role="img" aria-label="delete">🗑️</span>
                                </button>
                            </>
                        )}
                    </div>
                ))}
            </div>
        </div>
        <div className="completed-page-backdrop" onClick={closeCompletedPage}></div>
    </div>
)}
        </div>
    )
}

export default TodoList
