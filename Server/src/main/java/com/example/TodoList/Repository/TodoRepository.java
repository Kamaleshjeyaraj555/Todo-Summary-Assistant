package com.example.TodoList.Repository;

import com.example.TodoList.Entity.TodoEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TodoRepository  extends JpaRepository<TodoEntity,Long> {
    List<TodoEntity> findByUsername(String username);
}
